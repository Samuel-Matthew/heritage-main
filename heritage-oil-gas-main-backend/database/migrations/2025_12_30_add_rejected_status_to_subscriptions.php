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
            // Change the status enum to include 'rejected'
            $table->enum('status', ['pending', 'active', 'expired', 'rejected'])
                ->default('pending')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Revert to the original enum without 'rejected'
            $table->enum('status', ['pending', 'active', 'expired'])
                ->default('pending')
                ->change();
        });
    }
};
