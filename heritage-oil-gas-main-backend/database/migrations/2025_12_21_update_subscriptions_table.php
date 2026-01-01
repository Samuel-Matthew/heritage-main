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
        Schema::table('subscriptions', function (Blueprint $table) {
            // Add subscription_plan_id column
            $table->foreignId('subscription_plan_id')->nullable()->constrained('subscription_plans')->after('store_id');

            // Add subscription_code column
            $table->string('subscription_code')->unique()->nullable()->after('id');

            // Add payment_receipt_path column
            $table->string('payment_receipt_path')->nullable()->after('subscription_plan_id');

            // Add rejection_reason column
            $table->text('rejection_reason')->nullable()->after('payment_receipt_path');

            // Add approved_at timestamp column
            $table->timestamp('approved_at')->nullable()->after('rejection_reason');

            // Drop old plan column if it exists
            if (Schema::hasColumn('subscriptions', 'plan')) {
                $table->dropColumn('plan');
            }

            // Drop product_limit column if it exists
            if (Schema::hasColumn('subscriptions', 'product_limit')) {
                $table->dropColumn('product_limit');
            }
        });

        // Generate subscription codes for existing subscriptions
        $subscriptions = \DB::table('subscriptions')->whereNull('subscription_code')->get();
        foreach ($subscriptions as $subscription) {
            \DB::table('subscriptions')
                ->where('id', $subscription->id)
                ->update(['subscription_code' => 'SUB-' . $subscription->store_id . '-' . $subscription->id . '-' . strtoupper(substr(uniqid(), -6))]);
        }

        // Make subscription_code not nullable
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('subscription_code')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Reverse the changes
            $table->dropForeignIdFor(\App\Models\SubscriptionPlan::class, 'subscription_plan_id');
            $table->dropColumn('subscription_plan_id');
            $table->dropColumn('payment_receipt_path');
            $table->dropColumn('rejection_reason');
            $table->dropColumn('approved_at');
            $table->string('plan')->nullable();
            $table->integer('product_limit')->nullable();
        });
    }
};
