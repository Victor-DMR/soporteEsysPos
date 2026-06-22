<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use App\Models\CompanySetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@soporte.test'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'role' => 'administrador',
                'active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'tecnico@soporte.test'],
            [
                'name' => 'Tecnico Demo',
                'phone' => '573001112233',
                'password' => Hash::make('password'),
                'role' => 'tecnico',
                'active' => true,
            ]
        );

        CompanySetting::current();
    }
}
