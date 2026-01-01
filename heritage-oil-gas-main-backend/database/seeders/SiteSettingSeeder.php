<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SiteSetting;

class SiteSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SiteSetting::firstOrCreate(
            ['id' => 1],
            [
                'site_name' => 'Heritage Energy',
                'site_title' => 'Heritage Energy | Leading provider of oil and gas products and services',
                'meta_description' => 'Heritage Energy is a leading provider of high-quality lubricants, fuel products, machinery parts, and safety equipment in Nigeria. We connect businesses with trusted suppliers to ensure reliable access to essential oil and gas products.',
                'meta_keywords' => 'Heritage Energy, oil and gas, lubricants, fuel products, machinery parts, safety equipment, Nigeria',
                'logo' => null,
                'favicon' => 'images/favicon-heritage.png',
            ]
        );
    }
}
