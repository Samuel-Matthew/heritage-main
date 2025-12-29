<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends VerifyEmail
{
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
            ->line('This verification link will expire in 60 minutes.');
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl($notifiable): string
    {
        $frontendUrl = config('app.frontend_url') ?? 'http://localhost:8080';
        $id = $notifiable->getKey();
        $hash = sha1($notifiable->getEmailForVerification());

        return "{$frontendUrl}/verify-email?id={$id}&hash={$hash}";
    }
}
