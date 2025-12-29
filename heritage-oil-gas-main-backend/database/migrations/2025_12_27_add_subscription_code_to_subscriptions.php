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
            $table->string('subscription_code')->unique()->nullable()->after('id');
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
            $table->string('subscription_code')->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropUnique(['subscription_code']);
            $table->dropColumn('subscription_code');
        });
    }
};
