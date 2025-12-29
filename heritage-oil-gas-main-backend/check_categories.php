<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';

use App\Models\Category;

$categories = Category::all();
echo "\n=== Categories in Database ===\n";
foreach ($categories as $cat) {
    echo "ID: {$cat->id} | Name: {$cat->name} | Total Products: {$cat->total_products}\n";
}

echo "\n=== API Response Would Be ===\n";
$counts = Category::where('is_active', true)
    ->pluck('total_products', 'name');
echo json_encode($counts, JSON_PRETTY_PRINT) . "\n";
