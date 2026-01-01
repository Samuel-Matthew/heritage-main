<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Store;

class StoreRegistrationNotification extends Notification
{
    use Queueable;

    protected $store;

    /**
     * Create a new notification instance.
     */
    public function __construct(Store $store)
    {
        $this->store = $store;
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
            ->subject('Store Registration Submitted - Heritage Oil & Gas')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Thank you for submitting your seller registration to Heritage Oil & Gas Marketplace.')
            ->line('**Store Name:** ' . $this->store->name)
            ->line('**Registration Status:** Pending Review')
            ->line('')
            ->line('Our team will review your application, documents, and business information within 24-48 hours.')
            ->line('')
            ->line('**What happens next:**')
            ->line('1. We will verify your documents and business credentials')
            ->line('2. You will receive an email notification with the verification result')
            ->line('3. Once approved, you can access your seller dashboard and start listing products')
            ->line('')
            ->line('If you have any questions or need to update your information, please contact our support team.')
            ->action('View Your Dashboard', $dashboardUrl . '/seller/dashboard')
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
            'store_id' => $this->store->id,
            'store_name' => $this->store->name,
            'status' => 'pending_review',
        ];
    }
}
