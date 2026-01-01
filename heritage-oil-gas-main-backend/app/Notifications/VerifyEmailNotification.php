<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends Notification
{
    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Your Email Address - Heritage Oil & Gas')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Thank you for registering with Heritage Oil & Gas Marketplace.')
            ->line('Please verify your email address to activate your account.')
            ->action('Verify Email Address', $verificationUrl)
            ->line('If you did not create this account, no further action is required.')
            ->line('This verification link will expire in 10 minutes.')
            ->salutation('Best regards, Heritage Oil & Gas Team');
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl($notifiable): string
    {
        $frontendUrl = config('app.frontend_url');
        $id = $notifiable->getKey();
        $hash = sha1($notifiable->getEmailForVerification());

        return "{$frontendUrl}/verify-email?id={$id}&hash={$hash}";
    }
}
