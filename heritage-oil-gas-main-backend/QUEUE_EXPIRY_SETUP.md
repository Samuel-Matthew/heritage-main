# Queue-Based Expiry System Setup Guide

## Overview
Your featured products and hot deals now use Laravel's queue system instead of the scheduler. This means:
- Expiry jobs are dispatched when products are featured
- Jobs execute at exact times (finish_time for featured products, deal_end_at for hot deals)
- More reliable and easier to test than scheduler-based approach

## Current Setup

✅ **Queue Driver:** Database (configured in `.env`)  
✅ **Job Classes Created:**
- `App\Jobs\ExpireFeaturedProductJob` - Expires featured products
- `App\Jobs\ExpireHotDealJob` - Expires hot deals

✅ **Controller Updated:**
- `FeaturedProductController` now dispatches delayed jobs when products are featured/deals created

## How It Works

### When a Product is Featured:
```php
// Controller creates featured product
$featuredProduct = FeaturedProduct::create([...]);

// Dispatches job to expire at finish_time
ExpireFeaturedProductJob::dispatch($featuredProduct->id)
    ->delay($finishTime);
```

### When a Hot Deal is Created:
```php
// Controller creates hot deal
$hotDeal = HotDeal::create([...]);

// Dispatches job to expire at deal_end_at
ExpireHotDealJob::dispatch($hotDeal->id)
    ->delay($hotDeal->deal_end_at);
```

## Running the Queue Worker

### Development (Current Method)
The queue worker is already running. To view its status:
```bash
cd "c:\Users\HP 840 g3\Desktop\LARAVEL\heritage main\heritage-oil-gas-main-backend"
php artisan queue:work --timeout=60
```

### Production Setup (Windows Task Scheduler)

1. **Open Task Scheduler** (Win + R → taskschd.msc)
2. **Create Basic Task**
   - Name: "Laravel Queue Worker"
   - Trigger: Daily at startup (or specific time)
   - Action: Start program
   - Program: `C:\Users\HP 840 g3\Desktop\LARAVEL\heritage main\heritage-oil-gas-main-backend\run-queue-worker.bat`

3. **Configure Advanced Settings**
   - Go to Triggers tab
   - Add repetition: Every 1 hour (restart if it crashes)
   - General: Run with highest privileges ✓

### OR Using PowerShell (Recommended for Production)

Run as Administrator:
```powershell
$taskName = "Laravel Queue Worker"
$action = New-ScheduledTaskAction -Execute "C:\Users\HP 840 g3\Desktop\LARAVEL\heritage main\heritage-oil-gas-main-backend\run-queue-worker.bat"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "$env:COMPUTERNAME\$env:USERNAME" -LogonType S4U -RunLevel Highest
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Force
```

## Testing Queue Expiry

### Method 1: Manual Test Command
```bash
php artisan test:queue-expiry 5
```
This will:
1. Find an active featured product
2. Dispatch an expiry job to run in 5 seconds
3. Show you the scheduled execution time

Watch the database and the product's `is_active` should change to false after 5 seconds.

### Method 2: Check Queue Jobs Table
```bash
php artisan tinker
>>> DB::table('jobs')->get();
```

This shows pending jobs in the queue.

### Method 3: Monitor Queue Processing
With queue worker running, you'll see output like:
```
2025-12-27 14:23:45 App\Jobs\ExpireFeaturedProductJob: Processed
2025-12-27 14:24:50 App\Jobs\ExpireHotDealJob: Processed
```

## Monitoring & Debugging

### View Failed Jobs
```bash
php artisan queue:failed
```

### Retry Failed Jobs
```bash
php artisan queue:retry all
```

### View Queue Metrics
```bash
php artisan queue:monitor
```

## Fallback: Keep Scheduler Commands

The original scheduler commands (ExpireFeaturedProducts, ExpireHotDeals) still exist as a safety net:
```bash
php artisan schedule:run  # Run scheduler commands
```

This provides a backup expiry mechanism if queue jobs fail.

## Configuration Files

### Queue Config (.env)
```
QUEUE_CONNECTION=database
```

### Queue Config (config/queue.php)
```php
'database' => [
    'driver' => 'database',
    'connection' => env('DB_QUEUE_CONNECTION'),
    'table' => env('DB_QUEUE_TABLE', 'jobs'),
    'queue' => env('DB_QUEUE', 'default'),
    'retry_after' => 90,  // Retry if job fails
    'after_commit' => false,
],
```

## Advantages Over Scheduler

| Feature | Queue | Scheduler |
|---------|-------|-----------|
| Exact timing | ✅ Yes | ⚠️ Approximate |
| Reliability | ✅ High | ⚠️ Depends on system |
| Job tracking | ✅ Yes (database) | ❌ No |
| Retry failed jobs | ✅ Yes | ❌ No |
| Easy to test | ✅ Yes | ⚠️ Hard to test |
| System dependent | ❌ No | ✅ Yes (needs cron/Task Scheduler) |

## Next Steps

1. ✅ Queue jobs are dispatched when products are featured
2. ⏳ Start queue worker: `php artisan queue:work`
3. ⏳ Test with: `php artisan test:queue-expiry 5`
4. ⏳ Set up Task Scheduler for production
5. ⏳ Monitor with: `php artisan queue:monitor`

## Troubleshooting

### Jobs not executing?
- Check queue worker is running: `php artisan queue:work`
- Verify database connection
- Check `jobs` table for pending jobs

### Job failing repeatedly?
- Check `failed_jobs` table
- View error: `php artisan queue:failed`
- Retry: `php artisan queue:retry all`

### Queue worker keeps stopping?
- Use supervisor (Linux) or Task Scheduler (Windows)
- See "Production Setup" section above

## Migration Back to Scheduler

If you prefer to keep scheduler-based approach:
```bash
# Remove queue dispatching from controller
# Keep ExpireFeaturedProducts and ExpireHotDeals commands
# Run: php artisan schedule:run (or set up Task Scheduler)
```

The scheduled commands are still available in `app/Console/Commands/` as fallback.
