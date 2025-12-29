<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic Store',
                'slug' => 'basic',
                'description' => 'Free plan - No product listings allowed',
                'price' => 0,
                'product_limit' => 0,
                'bank_account_name' => null,
                'bank_account_number' => null,
                'bank_name' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Silver Store',
                'slug' => 'silver',
                'description' => 'List up to 5 products per month',
                'price' => 5000,
                'product_limit' => 5,
                'bank_account_name' => 'Heritage Energy Optimum Global Limited',
                'bank_account_number' => '1013259887',
                'bank_name' => 'Keystone Bank',
                'is_active' => true,
            ],
            [
                'name' => 'Gold Store',
                'slug' => 'gold',
                'description' => 'List up to 10 products per month',
                'price' => 7500,
                'product_limit' => 10,
                'bank_account_name' => 'Heritage Energy Optimum Global Limited',
                'bank_account_number' => '1013259887',
                'bank_name' => 'Keystone Bank',
                'is_active' => true,
            ],
            [
                'name' => 'Platinum Store',
                'slug' => 'platinum',
                'description' => 'List up to 20 products per month',
                'price' => 12000,
                'product_limit' => 20,
                'bank_account_name' => 'Heritage Energy Optimum Global Limited',
                'bank_account_number' => '1013259887',
                'bank_name' => 'Keystone Bank',
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
