<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        // Seed product categories
        $this->call(CategorySeeder::class);
        $this->call(SubscriptionPlanSeeder::class);

        // Seed site settings
        try {
            $this->call(SiteSettingSeeder::class);
        } catch (\Exception $e) {
            \Log::warning('SiteSettingSeeder failed: ' . $e->getMessage());
        }

        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test Admin',
            'email' => 'admin@heritageenergyglobal.com',
            'role' => 'super_admin',
            'password' => bcrypt('admin123'),
        ]);
    }
}
