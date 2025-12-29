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
        Schema::table('stores', function (Blueprint $table) {
            $table->string('alternate_phone')->nullable()->after('phone');
            $table->string('city')->nullable()->after('address');
            $table->string('website')->nullable()->after('email');
            $table->string('opening_hours')->nullable()->after('business_lines');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['alternate_phone', 'city', 'website', 'opening_hours']);
        });
    }
};
