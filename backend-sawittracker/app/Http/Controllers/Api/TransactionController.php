<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmer;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * Display a listing of harvest transactions.
     */
    public function index(): JsonResponse
    {
        $transactions = Transaction::with('farmer')->latest()->get();
        
        return response()->json([
            'success' => true,
            'message' => 'List Data Transaksi Panen',
            'data' => $transactions
        ]);
    }

    /**
     * Store a newly created harvest transaction in storage.
     * Menggunakan DB::transaction untuk menjamin konsistensi data PostgreSQL.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'farmer_id' => 'required|exists:farmers,id',
            'date' => 'required|date',
            'bruto_weight' => 'required|integer|min:0',
            'tarra_weight' => 'required|integer|min:0|lte:bruto_weight',
            'price_per_kg' => 'required|numeric|min:0',
            'deduct_debt' => 'required|boolean',
        ], [
            'tarra_weight.lte' => 'Potongan timbangan (tarra) tidak boleh melebihi berat kotor (bruto).',
        ]);
        
        $shouldDeductDebt = $request->input('deduct_debt', true);

        try {
            $transaction = DB::transaction(function () use ($validated, $request, $shouldDeductDebt) {
                // 1. Lock row Petani (lockForUpdate) untuk mencegah race condition saat high-concurrency di PostgreSQL
                $farmer = Farmer::lockForUpdate()->findOrFail($validated['farmer_id']);

                // 2. Hitung berat bersih (netto)
                $nettoWeight = $validated['bruto_weight'] - $validated['tarra_weight'];

                // 3. Hitung total harga kotor (gross)
                $totalGrossPrice = $nettoWeight * $validated['price_per_kg'];

                // 4. Cek dan potong hutang petani jika total_debt > 0
                $currentDebt = $farmer->total_debt;
                $debtDeduction = 0;
                
                // Potongan maksimal sebesar total_gross_price atau sisa hutang (mana yang lebih kecil)
                if ($shouldDeductDebt === true && currentDebt > 0) {
                    $debtDeduction = min($currentDebt, $totalGrossPrice);
                }

                // 5. Hitung total harga bersih yang dibayar ke petani (net price)
                $totalNetPrice = $totalGrossPrice - $debtDeduction;

                // 6. Simpan transaksi panen
                $newTransaction = Transaction::create([
                    'user_id' => $request->user() ? $request->user()->id : $farmer->user_id,
                    'farmer_id' => $farmer->id,
                    'date' => $validated['date'],
                    'bruto_weight' => $validated['bruto_weight'],
                    'tarra_weight' => $validated['tarra_weight'],
                    'netto_weight' => $nettoWeight,
                    'price_per_kg' => $validated['price_per_kg'],
                    'total_gross_price' => $totalGrossPrice,
                    'debt_deduction' => $debtDeduction,
                    'total_net_price' => $totalNetPrice,
                ]);

                // 7. Update berkurangnya total_debt di tabel farmers
                if ($debtDeduction > 0) {
                    $farmer->decrement('total_debt', $debtDeduction);
                }

                return $newTransaction;
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi panen berhasil disimpan dan potongan hutang telah diperbarui',
                'data' => $transaction->load('farmer')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan transaksi panen: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified transaction.
     */
    public function show(Transaction $transaction): JsonResponse
    {
        $transaction->load('farmer');

        return response()->json([
            'success' => true,
            'message' => 'Detail Data Transaksi Panen',
            'data' => $transaction
        ]);
    }

    /**
     * Remove the specified transaction from storage.
     */
    public function destroy(Transaction $transaction): JsonResponse
    {
        // Dalam akuntansi & sistem sawit, jika transaksi panen dihapus,
        // hutang yang sempat terpotong harus dikembalikan lagi (reversal).
        DB::transaction(function () use ($transaction) {
            if ($transaction->debt_deduction > 0) {
                $transaction->farmer()->increment('total_debt', $transaction->debt_deduction);
            }
            $transaction->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Transaksi panen berhasil dihapus (potongan hutang dikembalikan ke saldo petani)'
        ]);
    }
}
