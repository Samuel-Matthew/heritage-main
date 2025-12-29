<?php

require_once 'vendor/autoload.php';
require_once 'bootstrap/app.php';

use App\Models\User;

$users = User::orderBy('created_at', 'desc')->limit(5)->get(['id', 'name', 'email', 'created_at']);

echo "Total users: " . User::count() . "\n";
echo "Last 5 users:\n";
foreach ($users as $user) {
    echo "ID: {$user->id}, Name: {$user->name}, Email: {$user->email}, Created: {$user->created_at}\n";
}
