<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    use WithoutModelEvents;
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Automotive Lubricants',
                'description' => 'Engine oils, transmission fluids, and automotive care products',
            ],
            [
                'name' => 'Industrial Lubricants',
                'description' => 'Heavy-duty oils for industrial machinery and equipment',
            ],
            [
                'name' => 'Greases',
                'description' => 'Multi-purpose greases for various applications',
            ],
            [
                'name' => 'Fuel Products',
                'description' => 'Diesel, petrol additives, and fuel treatments',
            ],
            [
                'name' => 'Machinery Parts',
                'description' => 'Replacement parts for industrial machinery',
            ],
            [
                'name' => 'Safety Equipment',
                'description' => 'Personal protective equipment and safety gear',
            ],
        ];

        foreach ($categories as $category) {
            Category::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'description' => $category['description'],
            ]);
        }
    }
}
