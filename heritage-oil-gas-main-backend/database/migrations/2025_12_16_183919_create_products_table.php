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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description');
            $table->decimal('old_price', 10, 2)->nullable()->default(null);
            $table->decimal('new_price', 10, 2)->default(0);
            $table->json('specifications')->nullable();
            $table->enum('status', ['draft', 'active', 'suspended'])->default('active');
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->unique(['store_id', 'slug']);
            $table->index('status');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
