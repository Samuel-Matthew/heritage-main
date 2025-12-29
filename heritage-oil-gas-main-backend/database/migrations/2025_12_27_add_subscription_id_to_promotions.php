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
        Schema::table('featured_products', function (Blueprint $table) {
            $table->foreignId('subscription_id')->nullable()->after('store_id')->constrained('subscriptions')->onDelete('set null');
        });

        Schema::table('hot_deals', function (Blueprint $table) {
            $table->foreignId('subscription_id')->nullable()->after('store_id')->constrained('subscriptions')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('featured_products', function (Blueprint $table) {
            if (Schema::hasColumn('featured_products', 'subscription_id')) {
                $table->dropForeignKey(['subscription_id']);
                $table->dropColumn('subscription_id');
            }
        });

        Schema::table('hot_deals', function (Blueprint $table) {
            if (Schema::hasColumn('hot_deals', 'subscription_id')) {
                $table->dropForeignKey(['subscription_id']);
                $table->dropColumn('subscription_id');
            }
        });
    }
};
