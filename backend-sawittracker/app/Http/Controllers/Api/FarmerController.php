<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmer;
use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FarmerController extends Controller
{
    /**
     * Display a listing of farmers.
     */
    public function index(): JsonResponse
    {
        $farmers = Farmer::with('user')->latest()->get();
        return response()->json([
            'success' => true,
            'message' => 'List Data Petani',
            'data' => $farmers
        ]);
    }

    public function topDebtors(): JsonResponse
    {
        $topFarmers = Farmer::orderBy('total_debt', 'desc')->take(3)->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar 3 petani denganKasbon Tebesar',
            'data' => $topFarmers
        ]);
    }

    /**
     * Store a newly created farmer in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'total_debt' => 'nullable|numeric|min:0',
        ]);

        $farmer = DB::transaction(function () use ($validated, $request) {
            $newFarmer = Farmer::create([
                'user_id' => $request->user() ? $request->user()->id : 1,
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'total_debt' => $validated['total_debt'] ?? 0,
            ]);

            if (($validated['total_debt'] ?? 0) > 0) {
                Debt::create([
                    'farmer_id' => $newFarmer->id,
                    'type' => 'uang',
                    'amount' => $validated['total_debt'],
                    'status' => 'unpaid',
                ]);
            }

            return $newFarmer;
        });

        return response()->json([
            'success' => true,
            'message' => 'Petani berhasil ditambahkan',
            'data' => $farmer->load('user')
        ], 201);
    }

    /**
     * Display the specified farmer with their transactions and debts.
     */
    public function show(Farmer $farmer): JsonResponse
    {
        $farmer->load(['user', 'transactions', 'debts']);

        return response()->json([
            'success' => true,
            'message' => 'Detail Data Petani',
            'data' => $farmer
        ]);
    }

    /**
     * Update the specified farmer in storage.
     */
    public function update(Request $request, Farmer $farmer): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'sometimes|required|exists:users,id',
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'total_debt' => 'nullable|numeric|min:0',
        ]);

        $farmer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data Petani berhasil diperbarui',
            'data' => $farmer
        ]);
    }

    /**
     * Remove the specified farmer from storage.
     */
    public function destroy(Farmer $farmer): JsonResponse
    {
        $farmer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data Petani berhasil dihapus'
        ]);
    }
}
