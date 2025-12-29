@echo off
cd /d "C:\Users\HP 840 g3\Desktop\LARAVEL\heritage main\heritage-oil-gas-main-backend"
php artisan schedule:run >> storage/logs/scheduler.log 2>&1
