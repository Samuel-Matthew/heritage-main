<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Subscription;

class SubscriptionApprovedNotification extends Notification
{
    use Queueable;

    protected $subscription;

    /**
     * Create a new notification instance.
     */
    public function __construct(Subscription $subscription)
    {
        $this->subscription = $subscription;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $dashboardUrl = config('app.dashboard_url');
        $planName = $this->subscription->plan->name;
        $startsAt = $this->subscription->starts_at->format('M d, Y');
        $endsAt = $this->subscription->ends_at->format('M d, Y');

        return (new MailMessage)
            ->subject('Subscription Approved! - Heritage Oil & Gas')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Great news! Your subscription for **' . $this->subscription->store->name . '** has been approved by our team.')
            ->line('')
            ->line('**Subscription Details:**')
            ->line('Plan: **' . $planName . '**')
            ->line('Store: **' . $this->subscription->store->name . '**')
            ->line('Subscription Code: **' . $this->subscription->subscription_code . '**')
            ->line('Active Period: ' . $startsAt . ' to ' . $endsAt)
            ->line('')
            ->line('Your subscription is now **ACTIVE** and your store is ready to start selling!')
            ->line('')
            ->line('**What you can now do:**')
            ->line('✓ Upload and manage your products')
            ->line('✓ Create promotions and featured listings')
            ->line('')
            ->action('Access Your Dashboard', $dashboardUrl . '/seller/dashboard')
            ->line('')
            ->line('Thank you for being part of the Heritage Energy marketplace!')
            // ->line('Best regards,')
            // ->line('Heritage Energy Team')
            ;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'store_name' => $this->subscription->store->name,
            'plan_name' => $this->subscription->plan->name,
            'status' => 'approved',
        ];
    }
}
