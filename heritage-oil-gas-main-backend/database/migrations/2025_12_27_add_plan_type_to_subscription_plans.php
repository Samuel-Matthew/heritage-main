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
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->string('plan_type')->nullable()->after('slug')->comment('Plan type: basic, silver, gold, platinum');
        });

        // Populate plan_type based on slug values
        \DB::table('subscription_plans')->update([
            'plan_type' => \DB::raw('CASE WHEN slug = "basic" THEN "basic" WHEN slug = "silver" THEN "silver" WHEN slug = "gold" THEN "gold" WHEN slug = "platinum" THEN "platinum" ELSE "basic" END')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn('plan_type');
        });
    }
};
