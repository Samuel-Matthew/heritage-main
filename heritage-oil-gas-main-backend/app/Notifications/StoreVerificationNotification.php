<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Store;

class StoreVerificationNotification extends Notification
{
    use Queueable;

    protected $store;
    protected $approved;

    /**
     * Create a new notification instance.
     */
    public function __construct(Store $store, bool $approved = true)
    {
        $this->store = $store;
        $this->approved = $approved;
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

        if ($this->approved) {
            return (new MailMessage)
                ->subject('Your Store Has Been Approved! 🎉 - Heritage Oil & Gas')
                ->greeting('Hello ' . $notifiable->name . '!')
                ->line('Congratulations! Your store **' . $this->store->name . '** has been verified and approved by our team.')
                ->line('')
                ->line('**Your store is now active!** You can now:')
                ->line('✓ Access your seller dashboard')
                ->line('✓ Upload and manage your products')
                ->line('')
                ->line('To get started, visit your seller dashboard and choose a subscription plan that suits your business needs.')
                ->action('Access Your Dashboard', $dashboardUrl . '/seller/dashboard')
                ->line('')
                ->line('Thank you for being part of the Heritage Energy marketplace!')
                // ->line('Best regards,')
                // ->line('Heritage Energy Team')
                ;
        } else {
            return (new MailMessage)
                ->subject('Store Verification Update - Heritage Oil & Gas')
                ->greeting('Hello ' . $notifiable->name . '!')
                ->line('Thank you for your interest in becoming a seller on Heritage Oil & Gas Marketplace.')
                ->line('')
                ->line('Unfortunately, your store application for **' . $this->store->name . '** could not be approved at this time.')
                ->line('')
                ->line('**Reason for rejection:**')
                ->line($this->store->rejection_reason ?? 'Please contact our support team for more information.')
                ->line('')
                ->line('You can reapply after addressing the issues mentioned above. Our support team is here to help!')
                ->action('Contact Support', 'mailto:support@heritageenergyglobal.com')
                ->line('')
                // ->line('Best regards,')
                // ->line('Heritage Energy Team')
                ;
        }
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
            'status' => $this->approved ? 'approved' : 'rejected',
        ];
    }
}
