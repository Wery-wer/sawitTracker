<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Farmer;
use App\Models\Transaction;
use App\Models\Debt;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TbsTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::first();
        if (!$admin) {
            $this->command->error('User admin belum ada! Jalankan DatabaseSeeder terlebih dahulu.');
            return;
        }

        $farmers = Farmer::all();
        if ($farmers->isEmpty()) {
            $this->command->error('Data petani belum ada! Jalankan DatabaseSeeder terlebih dahulu.');
            return;
        }

        $this->command->info('Memulai seeding data transaksi TBS (Tandan Buah Segar)...');

        $transactionsData = [
            // Transaksi Hari Ini (Today)
            [
                'farmer' => 'Haji Subianto',
                'date' => Carbon::today()->format('Y-m-d'),
                'bruto' => 5400,
                'tarra' => 1400,
                'netto' => 4000,
                'price' => 2500,
                'deduction' => 500000, // Potong kasbon 500rb
            ],
            [
                'farmer' => 'Pak Budi Santoso',
                'date' => Carbon::today()->format('Y-m-d'),
                'bruto' => 3800,
                'tarra' => 800,
                'netto' => 3000,
                'price' => 2500,
                'deduction' => 0,
            ],
            [
                'farmer' => 'Ibu Ratna Wati',
                'date' => Carbon::today()->format('Y-m-d'),
                'bruto' => 4600,
                'tarra' => 1100,
                'netto' => 3500,
                'price' => 2500,
                'deduction' => 750000, // Potong kasbon 750rb
            ],
            [
                'farmer' => 'Pak Hendra Kurniawan',
                'date' => Carbon::today()->format('Y-m-d'),
                'bruto' => 6200,
                'tarra' => 1700,
                'netto' => 4500,
                'price' => 2500,
                'deduction' => 1000000, // Potong kasbon 1jt
            ],
            // Transaksi Kemarin (Yesterday)
            [
                'farmer' => 'Pak Asep Saepudin',
                'date' => Carbon::yesterday()->format('Y-m-d'),
                'bruto' => 3200,
                'tarra' => 700,
                'netto' => 2500,
                'price' => 2480,
                'deduction' => 250000,
            ],
            [
                'farmer' => 'Haji Subianto',
                'date' => Carbon::yesterday()->format('Y-m-d'),
                'bruto' => 7100,
                'tarra' => 2100,
                'netto' => 5000,
                'price' => 2480,
                'deduction' => 500000,
            ],
            [
                'farmer' => 'Pak Budi Santoso',
                'date' => Carbon::yesterday()->format('Y-m-d'),
                'bruto' => 4100,
                'tarra' => 900,
                'netto' => 3200,
                'price' => 2480,
                'deduction' => 0,
            ],
            // Transaksi 2 Hari yang lalu
            [
                'farmer' => 'Ibu Ratna Wati',
                'date' => Carbon::today()->subDays(2)->format('Y-m-d'),
                'bruto' => 5000,
                'tarra' => 1200,
                'netto' => 3800,
                'price' => 2450,
                'deduction' => 500000,
            ],
            [
                'farmer' => 'Pak Hendra Kurniawan',
                'date' => Carbon::today()->subDays(2)->format('Y-m-d'),
                'bruto' => 6500,
                'tarra' => 1500,
                'netto' => 5000,
                'price' => 2450,
                'deduction' => 1000000,
            ],
            [
                'farmer' => 'Pak Asep Saepudin',
                'date' => Carbon::today()->subDays(3)->format('Y-m-d'),
                'bruto' => 3500,
                'tarra' => 800,
                'netto' => 2700,
                'price' => 2450,
                'deduction' => 0,
            ],
        ];

        $count = 0;
        foreach ($transactionsData as $data) {
            $farmer = $farmers->where('name', $data['farmer'])->first() ?? $farmers->first();

            $grossPrice = $data['netto'] * $data['price'];
            $netPrice = $grossPrice - $data['deduction'];

            Transaction::create([
                'user_id' => $admin->id,
                'farmer_id' => $farmer->id,
                'date' => $data['date'],
                'bruto_weight' => $data['bruto'],
                'tarra_weight' => $data['tarra'],
                'netto_weight' => $data['netto'],
                'price_per_kg' => $data['price'],
                'total_gross_price' => $grossPrice,
                'debt_deduction' => $data['deduction'],
                'total_net_price' => $netPrice,
            ]);

            // Jika ada potongan kasbon, kita catat juga riwayat pembayaran kasbon/utang jika mau,
            // atau cukup update sisa hutang petani jika diperlukan.
            if ($data['deduction'] > 0 && $farmer->total_debt >= $data['deduction']) {
                $farmer->total_debt -= $data['deduction'];
                $farmer->save();
            }

            $count++;
        }

        $this->command->info("Berhasil menambahkan {$count} data transaksi TBS baru!");
    }
}
