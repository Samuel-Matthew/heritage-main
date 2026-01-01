# Rate Limiting - Production Monitoring & Alerting

## 🎯 Overview

This guide covers monitoring and alerting for rate limit violations in production, helping you detect attacks, fine-tune limits, and maintain system security.

---

## 📊 Monitoring Setup

### Option 1: Database Monitoring Job

Create a Laravel job to monitor rate limit violations:

```bash
php artisan make:job MonitorRateLimits
```

**File**: `app/Jobs/MonitorRateLimits.php`

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\RateLimitLog;

class MonitorRateLimits implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Get all active rate limits
        $limits = Cache::store('database')->getStore()
            ->getConnection()->table('cache')
            ->where('key', 'like', 'rate_limit:%')
            ->get();

        $stats = [
            'total_limited_ips' => 0,
            'by_endpoint' => [],
            'high_activity' => [],
        ];

        foreach ($limits as $limit) {
            $stats['total_limited_ips']++;
            
            // Parse the key: rate_limit:endpoint:ip
            $parts = explode(':', $limit->key);
            if (count($parts) === 3) {
                $endpoint = $parts[1];
                $ip = $parts[2];
                
                $stats['by_endpoint'][$endpoint] = 
                    ($stats['by_endpoint'][$endpoint] ?? 0) + 1;
                
                // Log high activity (near limit)
                if ($limit->value > 3) {
                    $stats['high_activity'][] = [
                        'endpoint' => $endpoint,
                        'ip' => $ip,
                        'count' => $limit->value,
                    ];
                }
            }
        }

        // Log statistics
        Log::info('Rate limit monitoring', $stats);

        // Save to database for analytics
        if (!empty($stats['high_activity'])) {
            $this->logHighActivity($stats['high_activity']);
        }

        // Send alerts if threshold exceeded
        if ($stats['total_limited_ips'] > 100) {
            $this->sendAlert('High rate limit activity detected', $stats);
        }
    }

    private function logHighActivity(array $activity): void
    {
        foreach ($activity as $item) {
            RateLimitLog::create([
                'endpoint' => $item['endpoint'],
                'ip_address' => $item['ip'],
                'attempt_count' => $item['count'],
                'logged_at' => now(),
            ]);
        }
    }

    private function sendAlert(string $message, array $stats): void
    {
        // Send to Slack, email, or other alerting service
        Log::warning($message, $stats);
    }
}
```

### Option 2: Schedule the Monitoring Job

**File**: `app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule)
{
    // Monitor rate limits every minute
    $schedule->job(new MonitorRateLimits)
        ->everyMinute()
        ->withoutOverlapping();
}
```

### Option 3: Manual Monitoring Command

Create an artisan command:

```bash
php artisan make:command MonitorRateLimits
```

**File**: `app/Console/Commands/MonitorRateLimits.php`

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class MonitorRateLimits extends Command
{
    protected $signature = 'rate-limits:monitor {--endpoint= : Filter by endpoint}';
    protected $description = 'Monitor rate limit activity';

    public function handle()
    {
        $endpoint = $this->option('endpoint');
        
        $query = Cache::store('database')->getStore()
            ->getConnection()->table('cache')
            ->where('key', 'like', 'rate_limit:%');
        
        if ($endpoint) {
            $query->where('key', 'like', "%:$endpoint:%");
        }
        
        $limits = $query->get();

        $this->info("Found {$limits->count()} active rate limits");
        
        $table = [];
        foreach ($limits as $limit) {
            $parts = explode(':', $limit->key);
            if (count($parts) === 3) {
                $table[] = [
                    'Endpoint' => $parts[1],
                    'IP' => $parts[2],
                    'Count' => $limit->value,
                    'Expires' => $limit->expires_at,
                ];
            }
        }

        if (empty($table)) {
            $this->info('No rate limits currently active');
            return;
        }

        $this->table(
            ['Endpoint', 'IP', 'Count', 'Expires'],
            $table
        );
    }
}
```

Run with: `php artisan rate-limits:monitor`

---

## 🚨 Alert Setup

### Slack Integration

Install:
```bash
composer require slack/slack-sdk
```

**File**: Create `app/Notifications/RateLimitAlert.php`

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Slack\SlackMessage;

class RateLimitAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $endpoint,
        public string $ip,
        public int $count,
        public string $severity = 'warning'
    ) {}

    public function via($notifiable): array
    {
        return ['slack'];
    }

    public function toSlack($notifiable): SlackMessage
    {
        $color = $this->severity === 'critical' ? 'danger' : 'warning';
        
        return (new SlackMessage)
            ->$color()
            ->text("Rate Limit Alert: {$this->endpoint}")
            ->attachment(function ($attachment) {
                $attachment
                    ->title('Rate Limit Violation Detected')
                    ->fields([
                        'Endpoint' => $this->endpoint,
                        'IP Address' => $this->ip,
                        'Attempts' => $this->count,
                        'Time' => now()->format('Y-m-d H:i:s'),
                    ])
                    ->color($this->severity === 'critical' ? '#FF0000' : '#FFA500');
            });
    }
}
```

Send alert:
```php
Notification::route('slack', env('SLACK_WEBHOOK_URL'))
    ->notify(new RateLimitAlert('login', '192.168.1.100', 5, 'critical'));
```

---

## 📈 Analytics Dashboard

### Create Rate Limit Analytics Model

```bash
php artisan make:model RateLimitLog -m
```

**Migration**:
```php
Schema::create('rate_limit_logs', function (Blueprint $table) {
    $table->id();
    $table->string('endpoint');
    $table->string('ip_address');
    $table->integer('attempt_count');
    $table->string('action')->default('blocked');
    $table->timestamp('logged_at');
    $table->timestamps();
    
    $table->index(['endpoint', 'logged_at']);
    $table->index(['ip_address', 'logged_at']);
});
```

### Dashboard Controller

```php
<?php

namespace App\Http\Controllers;

use App\Models\RateLimitLog;
use Illuminate\Support\Facades\DB;

class RateLimitDashboardController extends Controller
{
    public function index()
    {
        $today = RateLimitLog::whereDate('logged_at', today())
            ->count();
        
        $byEndpoint = RateLimitLog::select('endpoint', DB::raw('count(*) as total'))
            ->groupBy('endpoint')
            ->orderByDesc('total')
            ->limit(5)
            ->get();
        
        $topIps = RateLimitLog::select('ip_address', DB::raw('count(*) as total'))
            ->groupBy('ip_address')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
        
        $hourly = RateLimitLog::select(
            DB::raw('DATE_FORMAT(logged_at, "%Y-%m-%d %H:00") as hour'),
            DB::raw('count(*) as total')
        )
            ->where('logged_at', '>=', now()->subHours(24))
            ->groupBy('hour')
            ->get();

        return view('rate-limits.dashboard', [
            'today' => $today,
            'by_endpoint' => $byEndpoint,
            'top_ips' => $topIps,
            'hourly' => $hourly,
        ]);
    }
}
```

---

## 🔍 Real-Time Monitoring with Log Tailing

### Monitor Logs in Real-Time

```bash
# Watch all rate limit errors
tail -f storage/logs/laravel.log | grep "429\|rate_limit"

# Watch specific endpoint
tail -f storage/logs/laravel.log | grep "login.*429"

# Count 429 errors per minute
tail -f storage/logs/laravel.log | grep "429" | wc -l

# Watch with colors (requires ccze)
tail -f storage/logs/laravel.log | grep "429" | ccze -A
```

### Parse Rate Limit Errors

```bash
# Show last 100 rate limit violations
grep "429" storage/logs/laravel.log | tail -100

# Count by IP
grep "429" storage/logs/laravel.log | grep -oP '(?<=ip":")[^"]+' | sort | uniq -c | sort -rn

# Show timeline
grep "429" storage/logs/laravel.log | cut -d' ' -f1,2

# Export to CSV
grep "429" storage/logs/laravel.log | awk -F' ' '{print $1","$2}' > rate_limits.csv
```

---

## 🎯 Alerting Thresholds

### Recommended Alert Thresholds

| Threshold | Condition | Action |
|-----------|-----------|--------|
| 10 | IPs blocked in 1 minute | Log and monitor |
| 50 | IPs blocked in 1 minute | Send warning |
| 100 | IPs blocked in 1 minute | Send critical alert |
| 1000 | Total blocked in 1 hour | Investigate possible attack |

### Implementation

```php
// In MonitorRateLimits job
if ($stats['total_limited_ips'] > 10) {
    Log::warning('Rate limit activity increasing', $stats);
}

if ($stats['total_limited_ips'] > 50) {
    Notification::route('slack', env('SLACK_WEBHOOK_URL'))
        ->notify(new RateLimitAlert('multiple', 'N/A', $stats['total_limited_ips'], 'warning'));
}

if ($stats['total_limited_ips'] > 100) {
    Notification::route('slack', env('SLACK_WEBHOOK_URL'))
        ->notify(new RateLimitAlert('multiple', 'N/A', $stats['total_limited_ips'], 'critical'));
    
    // Optional: Automatically increase security
    $this->increaseSecurity();
}
```

---

## 📊 Metrics to Track

### Key Performance Indicators (KPIs)

1. **Blocked Requests per Hour**
   ```sql
   SELECT DATE_FORMAT(logged_at, "%Y-%m-%d %H:00") as hour,
          COUNT(*) as blocked_count
   FROM rate_limit_logs
   WHERE logged_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
   GROUP BY hour;
   ```

2. **Top Blocked IPs**
   ```sql
   SELECT ip_address, COUNT(*) as attempts
   FROM rate_limit_logs
   WHERE logged_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
   GROUP BY ip_address
   ORDER BY attempts DESC
   LIMIT 20;
   ```

3. **Endpoint Vulnerability**
   ```sql
   SELECT endpoint, COUNT(*) as blocked_count
   FROM rate_limit_logs
   WHERE logged_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
   GROUP BY endpoint;
   ```

4. **Attack Patterns**
   ```sql
   SELECT ip_address, endpoint, 
          COUNT(*) as attempts,
          TIMESTAMPDIFF(MINUTE, MIN(logged_at), MAX(logged_at)) as duration_minutes
   FROM rate_limit_logs
   WHERE logged_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
   GROUP BY ip_address, endpoint
   HAVING attempts > 5;
   ```

---

## 🛡️ Automated Responses

### Auto-Block Persistent Offenders

```php
// In MonitorRateLimits job
$persistentOffenders = RateLimitLog::select('ip_address', DB::raw('count(*) as total'))
    ->where('logged_at', '>=', now()->subHours(1))
    ->groupBy('ip_address')
    ->having('total', '>', 100)
    ->get();

foreach ($persistentOffenders as $offender) {
    $this->blockIP($offender->ip_address, 3600); // Block for 1 hour
    
    Log::warning("Auto-blocked IP due to persistent violations", [
        'ip' => $offender->ip_address,
        'violations' => $offender->total,
    ]);
}
```

### Implement IP Blocking

```php
private function blockIP(string $ip, int $seconds): void
{
    Cache::put("blocked_ip:{$ip}", true, $seconds);
}

// Check in middleware
if (Cache::has("blocked_ip:{$request->ip()}")) {
    return response()->json([
        'message' => 'Access denied',
    ], 403);
}
```

---

## 📧 Email Alerts

### Send Email on Critical Violations

```php
// In MonitorRateLimits job
use App\Mail\RateLimitAlert;

if ($stats['total_limited_ips'] > 100) {
    Mail::to(env('ADMIN_EMAIL'))
        ->send(new RateLimitAlert($stats));
}
```

**File**: `app/Mail/RateLimitAlert.php`

```php
<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RateLimitAlert extends Mailable
{
    public function __construct(public array $stats) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rate Limit Alert: Potential Attack',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.rate-limit-alert',
            with: [
                'stats' => $this->stats,
                'timestamp' => now(),
            ],
        );
    }
}
```

---

## 🔐 Security Monitoring Best Practices

1. **Regular Review**
   - Review logs weekly
   - Identify patterns
   - Adjust limits if needed

2. **Trend Analysis**
   - Track violations over time
   - Detect seasonal patterns
   - Identify new attack vectors

3. **Response Procedures**
   - Document your response procedures
   - Test incident response
   - Keep team updated

4. **Data Retention**
   - Keep logs for audit trail
   - Archive old logs
   - Comply with regulations

---

## 📝 Monitoring Checklist

- [ ] Monitoring job/command set up
- [ ] Alerts configured (Slack/Email)
- [ ] Dashboard created
- [ ] Thresholds defined
- [ ] Auto-blocking implemented
- [ ] Log rotation configured
- [ ] Team notified of monitoring
- [ ] Response procedures documented

---

## Next Steps

1. Set up monitoring job
2. Configure alerts (start with Slack)
3. Create dashboard
4. Define thresholds
5. Test alert system
6. Document procedures
7. Train team

