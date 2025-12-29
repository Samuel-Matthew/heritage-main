<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Category;
use App\Models\Product;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->integer('total_products')->default(0)->after('is_active');
        });

        // Populate the total_products column with actual counts
        $categories = Category::all();
        foreach ($categories as $category) {
            $count = Product::where('category_id', $category->id)
                ->where('status', 'active')
                ->count();
            $category->update(['total_products' => $count]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('total_products');
        });
    }
};
