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
        // Add subscription_code column to featured_products
        Schema::table('featured_products', function (Blueprint $table) {
            $table->string('subscription_code')->nullable()->after('subscription_id');
        });

        // Migrate data from subscription_id to subscription_code
        \DB::statement('
            UPDATE featured_products fp
            JOIN subscriptions s ON fp.subscription_id = s.id
            SET fp.subscription_code = s.subscription_code
            WHERE fp.subscription_id IS NOT NULL
        ');

        // Drop the old subscription_id column
        Schema::table('featured_products', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('featured_products_subscription_id_foreign');
            $table->dropColumn('subscription_id');
        });

        // Rename subscription_code to subscription_id (or keep as subscription_code)
        Schema::table('featured_products', function (Blueprint $table) {
            $table->foreign('subscription_code')
                ->references('subscription_code')
                ->on('subscriptions')
                ->onDelete('set null');
        });

        // Add subscription_code column to hot_deals
        Schema::table('hot_deals', function (Blueprint $table) {
            $table->string('subscription_code')->nullable()->after('subscription_id');
        });

        // Migrate data from subscription_id to subscription_code
        \DB::statement('
            UPDATE hot_deals hd
            JOIN subscriptions s ON hd.subscription_id = s.id
            SET hd.subscription_code = s.subscription_code
            WHERE hd.subscription_id IS NOT NULL
        ');

        // Drop the old subscription_id column
        Schema::table('hot_deals', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('hot_deals_subscription_id_foreign');
            $table->dropColumn('subscription_id');
        });

        // Add foreign key for subscription_code
        Schema::table('hot_deals', function (Blueprint $table) {
            $table->foreign('subscription_code')
                ->references('subscription_code')
                ->on('subscriptions')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // featured_products rollback
        Schema::table('featured_products', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('featured_products_subscription_code_foreign');
            $table->foreignId('subscription_id')->nullable()->after('store_id')->constrained('subscriptions')->onDelete('set null');
            $table->dropColumn('subscription_code');
        });

        // Migrate data back from subscription_code to subscription_id
        \DB::statement('
            UPDATE featured_products fp
            JOIN subscriptions s ON fp.subscription_code = s.subscription_code
            SET fp.subscription_id = s.id
        ');

        // hot_deals rollback
        Schema::table('hot_deals', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('hot_deals_subscription_code_foreign');
            $table->foreignId('subscription_id')->nullable()->after('store_id')->constrained('subscriptions')->onDelete('set null');
            $table->dropColumn('subscription_code');
        });

        // Migrate data back from subscription_code to subscription_id
        \DB::statement('
            UPDATE hot_deals hd
            JOIN subscriptions s ON hd.subscription_code = s.subscription_code
            SET hd.subscription_id = s.id
        ');
    }
};
