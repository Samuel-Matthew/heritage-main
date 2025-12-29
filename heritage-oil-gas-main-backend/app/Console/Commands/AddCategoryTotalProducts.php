<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Category;
use App\Models\Product;

class AddCategoryTotalProducts extends Command
{
    protected $signature = 'category:add-total-products';
    protected $description = 'Add total_products column to categories and populate counts';

    public function handle()
    {
        // Check if column exists
        $columns = DB::getSchemaBuilder()->getColumnListing('categories');

        if (!in_array('total_products', $columns)) {
            // Add the column
            DB::statement('ALTER TABLE categories ADD COLUMN total_products INT DEFAULT 0 AFTER is_active');
            $this->info("✓ Column 'total_products' added to categories table");
        } else {
            $this->info("✓ Column 'total_products' already exists");
        }

        // Populate the total_products column with actual counts
        $categories = Category::all();
        foreach ($categories as $category) {
            $count = Product::where('category_id', $category->id)
                ->where('status', 'active')
                ->count();
            $category->update(['total_products' => $count]);
            $this->info("✓ Updated category '{$category->name}' with {$count} products");
        }

        $this->info("\n✓ All categories updated successfully!");
    }
}
