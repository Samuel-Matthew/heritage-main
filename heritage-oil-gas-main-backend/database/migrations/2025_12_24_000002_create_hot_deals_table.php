<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hot_deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('plan_type')->default('basic'); // basic, silver, gold, platinum
            $table->decimal('original_price', 10, 2);
            $table->decimal('deal_price', 10, 2);
            $table->integer('discount_percentage'); // calculated automatically
            $table->dateTime('deal_start_at');
            $table->dateTime('deal_end_at');
            $table->text('deal_description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('activated_at')->nullable();
            $table->dateTime('deactivated_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('store_id');
            $table->index('product_id');
            $table->index('is_active');
            $table->index('deal_start_at');
            $table->index('deal_end_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hot_deals');
    }
};
