@echo off
cd /d "C:\Users\HP 840 g3\Desktop\LARAVEL\heritage main\heritage-oil-gas-main-backend"
php artisan queue:work --timeout=60 --tries=3 --max-time=3600
