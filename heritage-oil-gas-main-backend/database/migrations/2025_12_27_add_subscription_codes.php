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
        // Step 1: Add subscription_code to subscriptions
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'subscription_code')) {
                $table->string('subscription_code')->unique()->nullable()->after('id');
            }
        });

        // Step 2: Generate codes for existing subscriptions
        $subscriptions = \DB::table('subscriptions')->whereNull('subscription_code')->get();
        foreach ($subscriptions as $sub) {
            \DB::table('subscriptions')
                ->where('id', $sub->id)
                ->update([
                    'subscription_code' => 'SUB-' . str_pad($sub->store_id, 3, '0', STR_PAD_LEFT) . '-' . $sub->id . '-' . strtoupper(substr(uniqid(), -6))
                ]);
        }

        // Step 3: Make subscription_code NOT NULL
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('subscription_code')->nullable(false)->change();
        });

        // Step 4: Add subscription_code to featured_products
        Schema::table('featured_products', function (Blueprint $table) {
            if (!Schema::hasColumn('featured_products', 'subscription_code')) {
                $table->string('subscription_code')->nullable()->after('store_id');
            }
        });

        // Step 5: Migrate data from subscription_id to subscription_code
        \DB::statement('
            UPDATE featured_products fp
            INNER JOIN subscriptions s ON fp.subscription_id = s.id
            SET fp.subscription_code = s.subscription_code
            WHERE fp.subscription_id IS NOT NULL
        ');

        // Step 6: Add subscription_code to hot_deals
        Schema::table('hot_deals', function (Blueprint $table) {
            if (!Schema::hasColumn('hot_deals', 'subscription_code')) {
                $table->string('subscription_code')->nullable()->after('store_id');
            }
        });

        // Step 7: Migrate data from subscription_id to subscription_code
        \DB::statement('
            UPDATE hot_deals hd
            INNER JOIN subscriptions s ON hd.subscription_id = s.id
            SET hd.subscription_code = s.subscription_code
            WHERE hd.subscription_id IS NOT NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove columns added
        Schema::table('featured_products', function (Blueprint $table) {
            if (Schema::hasColumn('featured_products', 'subscription_code')) {
                $table->dropColumn('subscription_code');
            }
        });

        Schema::table('hot_deals', function (Blueprint $table) {
            if (Schema::hasColumn('hot_deals', 'subscription_code')) {
                $table->dropColumn('subscription_code');
            }
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'subscription_code')) {
                $table->dropUnique(['subscription_code']);
                $table->dropColumn('subscription_code');
            }
        });
    }
};
