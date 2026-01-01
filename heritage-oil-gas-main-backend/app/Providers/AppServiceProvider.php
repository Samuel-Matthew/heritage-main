<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use App\Services\RateLimitService;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register rate limit service as singleton
        $this->app->singleton(RateLimitService::class, function ($app) {
            return new RateLimitService($app->make('cache.store'));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url') . "/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });

        // Share site settings globally with all views (cached for performance)
        view()->composer('*', function ($view) {
            $siteSettings = Cache::rememberForever('site_settings', function () {
                return SiteSetting::first();
            });
            $view->with('siteSettings', $siteSettings);
        });
    }
}
