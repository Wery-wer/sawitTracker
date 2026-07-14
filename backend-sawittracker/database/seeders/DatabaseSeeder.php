<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Farmer;
use App\Models\Debt;
use App\Models\Transaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Buat User Admin
        $admin = User::create([
            'name' => 'Admin Koperasi SawitTracker',
            'email' => 'admin@sawittracker.com',
            'password' => Hash::make('password123'),
        ]);

        $this->command->info('User Admin berhasil dibuat: admin@sawittracker.com / password123');

        // 2. Buat Data Petani (Farmers)
        $farmersData = [
            [
                'user_id' => $admin->id,
                'name' => 'Haji Subianto',
                'phone' => '0812-3456-7890',
                'total_debt' => 1500000,
            ],
            [
                'user_id' => $admin->id,
                'name' => 'Pak Budi Santoso',
                'phone' => '0813-2233-4455',
                'total_debt' => 0,
            ],
            [
                'user_id' => $admin->id,
                'name' => 'Ibu Ratna Wati',
                'phone' => '0815-6677-8899',
                'total_debt' => 2000000,
            ],
            [
                'user_id' => $admin->id,
                'name' => 'Pak Hendra Kurniawan',
                'phone' => '0811-9988-7766',
                'total_debt' => 3250000,
            ],
            [
                'user_id' => $admin->id,
                'name' => 'Pak Asep Saepudin',
                'phone' => '0852-1122-3344',
                'total_debt' => 500000,
            ],
        ];

        $createdFarmers = [];
        foreach ($farmersData as $data) {
            $createdFarmers[] = Farmer::create($data);
        }

        $this->command->info('5 Data Petani berhasil dibuat!');

        // 3. Buat Data Kasbon (Debts) untuk petani yang memiliki hutang
        Debt::create([
            'farmer_id' => $createdFarmers[0]->id, // Haji Subianto
            'type' => 'uang',
            'amount' => 1500000,
            'status' => 'unpaid',
        ]);

        Debt::create([
            'farmer_id' => $createdFarmers[2]->id, // Ibu Ratna Wati
            'type' => 'pupuk',
            'amount' => 2000000,
            'status' => 'unpaid',
        ]);

        Debt::create([
            'farmer_id' => $createdFarmers[3]->id, // Pak Hendra Kurniawan
            'type' => 'uang',
            'amount' => 3250000,
            'status' => 'unpaid',
        ]);

        Debt::create([
            'farmer_id' => $createdFarmers[4]->id, // Pak Asep Saepudin
            'type' => 'pupuk',
            'amount' => 500000,
            'status' => 'unpaid',
        ]);

        $this->command->info('4 Data Kasbon/Utang berhasil dibuat!');

        // 4. Buat Data Transaksi Panen (TBS) Menggunakan Seeder Khusus
        $this->call([
            TbsTransactionSeeder::class,
        ]);
    }
}
