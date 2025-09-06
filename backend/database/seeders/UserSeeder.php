<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Wisely',
            'email' => 'wise360@gmail.com',
            'facebook_access_token' => null,
            'password' => Hash::make('password123'),
        ]);
    }
}
