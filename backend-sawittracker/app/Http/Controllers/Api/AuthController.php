<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login Admin (Email & Password) dan kembalikan Sanctum Token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah. Silakan periksa kembali kredensial Anda.'
            ], 401);
        }

        // Hapus token lama opsional (agar selalu clean token baru)
        // $user->tokens()->delete();

        $token = $user->createToken('sawittracker-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ]
        ], 200);
    }

    /**
     * Logout Admin (Cabut/Hapus Token saat ini).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil. Token telah dihapus dari sistem.'
        ], 200);
    }

    /**
     * Ambil data Admin yang sedang login (Profile / Me).
     */
    public function me(Request $request)
    {
        return response()->json([
            'data' => $request->user()
        ], 200);
    }
}
