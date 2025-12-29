<?php

require 'vendor/autoload.php';
require 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;
use App\Models\Category;
use App\Models\Product;

// Check if column exists
$columns = DB::getSchemaBuilder()->getColumnListing('categories');

if (!in_array('total_products', $columns)) {
    // Add the column
    DB::statement('ALTER TABLE categories ADD COLUMN total_products INT DEFAULT 0 AFTER is_active');
    echo "✓ Column 'total_products' added to categories table\n";
} else {
    echo "✓ Column 'total_products' already exists\n";
}

// Populate the total_products column with actual counts
$categories = Category::all();
foreach ($categories as $category) {
    $count = Product::where('category_id', $category->id)
        ->where('status', 'active')
        ->count();
    $category->update(['total_products' => $count]);
    echo "✓ Updated category '{$category->name}' with {$count} products\n";
}

echo "\n✓ All categories updated successfully!\n";
