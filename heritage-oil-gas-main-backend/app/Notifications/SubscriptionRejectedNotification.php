<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Subscription;

class SubscriptionRejectedNotification extends Notification
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
        $dashboardUrl = config('app.dashboard_url', 'http://localhost:5174');

        return (new MailMessage)
            ->subject('Subscription Rejected - Heritage Oil & Gas')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your subscription request for **' . $this->subscription->store->name . '** has been reviewed and rejected.')
            ->line('')
            ->line('**Reason for Rejection:**')
            ->line($this->subscription->rejection_reason)
            ->line('')
            ->line('Please review the reason above and contact our support team if you believe this was a mistake or if you need further assistance.')
            ->line('')
            ->line('You can resubmit your subscription request after addressing the issues mentioned above.')
            ->action('Contact Support', 'mailto:support@heritageenergyglobal.com')
            ->line('')
            ->line('Best regards,')
            ->line('Heritage Energy Team');
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
            'status' => 'rejected',
        ];
    }
}
