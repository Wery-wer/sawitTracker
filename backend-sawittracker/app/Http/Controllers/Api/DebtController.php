<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use App\Models\Farmer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DebtController extends Controller
{
    /**
     * Display a listing of debts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Debt::with('farmer')->latest();

        // Filter opsional berdasarkan status atau farmer_id
        if ($request->has('farmer_id')) {
            $query->where('farmer_id', $request->farmer_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'message' => 'List Data Kasbon / Utang',
            'data' => $query->get()
        ]);
    }

    /**
     * Store a newly created debt in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'farmer_id' => 'required|exists:farmers,id',
            'type' => 'required|in:uang,pupuk',
            'amount' => 'required|numeric|min:0.01',
            'status' => 'nullable|in:unpaid,paid',
        ]);

        $status = $validated['status'] ?? 'unpaid';

        try {
            $debt = DB::transaction(function () use ($validated, $status) {
                $farmer = Farmer::lockForUpdate()->findOrFail($validated['farmer_id']);

                $newDebt = Debt::create([
                    'farmer_id' => $farmer->id,
                    'type' => $validated['type'],
                    'amount' => $validated['amount'],
                    'status' => $status,
                ]);

                // Jika statusnya unpaid (belum lunas), otomatis tambahkan ke total_debt petani
                if ($status === 'unpaid') {
                    $farmer->increment('total_debt', $validated['amount']);
                }

                return $newDebt;
            });

            return response()->json([
                'success' => true,
                'message' => 'Kasbon/Utang berhasil dicatat dan saldo utang petani diperbarui',
                'data' => $debt->load('farmer')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mencatat kasbon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified debt.
     */
    public function show(Debt $debt): JsonResponse
    {
        $debt->load('farmer');

        return response()->json([
            'success' => true,
            'message' => 'Detail Data Kasbon / Utang',
            'data' => $debt
        ]);
    }

    /**
     * Update the specified debt.
     */
    public function update(Request $request, Debt $debt): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|required|in:uang,pupuk',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'status' => 'sometimes|required|in:unpaid,paid',
        ]);

        try {
            $updatedDebt = DB::transaction(function () use ($debt, $validated) {
                $farmer = Farmer::lockForUpdate()->findOrFail($debt->farmer_id);
                $oldStatus = $debt->status;
                $oldAmount = $debt->amount;

                $newStatus = $validated['status'] ?? $oldStatus;
                $newAmount = $validated['amount'] ?? $oldAmount;

                // Reversal saldo lama jika sebelumnya unpaid
                if ($oldStatus === 'unpaid') {
                    $farmer->decrement('total_debt', $oldAmount);
                }

                $debt->update($validated);

                // Aplikasikan saldo baru jika sekarang unpaid
                if ($newStatus === 'unpaid') {
                    $farmer->increment('total_debt', $newAmount);
                }

                return $debt;
            });

            return response()->json([
                'success' => true,
                'message' => 'Data Kasbon berhasil diperbarui',
                'data' => $updatedDebt->load('farmer')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui kasbon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified debt from storage.
     */
    public function destroy(Debt $debt): JsonResponse
    {
        DB::transaction(function () use ($debt) {
            if ($debt->status === 'unpaid') {
                $debt->farmer()->decrement('total_debt', $debt->amount);
            }
            $debt->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Data Kasbon berhasil dihapus'
        ]);
    }
}
