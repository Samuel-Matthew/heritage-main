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
        Schema::create('featured_products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('store_id');
            $table->string('plan_type')->default('basic'); // basic, silver, gold, platinum
            $table->integer('slot_position')->nullable(); // position in rotation
            $table->timestamp('featured_at'); // when it was featured
            $table->timestamp('start_time')->nullable(); // when feature starts
            $table->timestamp('finish_time')->nullable(); // when feature ends (by plan)
            $table->timestamp('rotated_out_at')->nullable(); // when it was rotated out
            $table->boolean('is_active')->default(true); // for manual deactivation
            $table->timestamps();

            // Indexes for performance
            $table->index('store_id');
            $table->index('product_id');
            $table->index('is_active');
            $table->index('featured_at');
        });

        // Add foreign key constraints after table creation
        Schema::table('featured_products', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('store_id')->references('id')->on('stores')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('featured_products');
    }
};
