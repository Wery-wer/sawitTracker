<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FarmerController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\UserController;

// 1. PUBLIC ROUTES (Tidak butuh token / login)
Route::post('/login', [AuthController::class, 'login']);

// Endpoint Harga Sawit Live (disimpan di Cache Supabase)
Route::get('/harga-sawit', function () {
    $harga = Cache::get('harga_sawit', 2500);
    return response()->json([
        'success' => true,
        'message' => 'Harga sawit hari ini',
        'data' => ['harga_sawit' => (int) $harga]
    ]);
});

Route::post('/harga-sawit', function (Request $request) {
    $request->validate(['harga_sawit' => 'required|numeric|min:1']);
    Cache::forever('harga_sawit', (int) $request->harga_sawit);
    return response()->json([
        'success' => true,
        'message' => 'Harga sawit berhasil diperbarui',
        'data' => $request->harga_sawit
    ]);
});

// 2. PROTECTED ROUTES (Wajib membawa header: Authorization: Bearer <token>)
Route::middleware('auth:sanctum')->group(function () {
    // Auth Management
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/farmers-top', [FarmerController::class, 'topDebtors']);


    // Resource Endpoints (SawitTracker Modules)
    Route::apiResource('users', UserController::class);
    Route::apiResource('farmers', FarmerController::class);
    Route::apiResource('transactions', TransactionController::class);
    Route::apiResource('debts', DebtController::class);
});
