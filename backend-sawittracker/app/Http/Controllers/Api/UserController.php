<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of admin users.
     */
    public function index(): JsonResponse
    {
        $users = User::withCount(['farmers', 'transactions'])->latest()->get();
        return response()->json([
            'success' => true,
            'message' => 'List Data Admin / Pengguna',
            'data' => $users
        ]);
    }

    /**
     * Store a newly created admin user in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin baru berhasil ditambahkan',
            'data' => $user
        ], 201);
    }

    /**
     * Display the specified admin user.
     */
    public function show(User $user): JsonResponse
    {
        $user->loadCount(['farmers', 'transactions']);
        return response()->json([
            'success' => true,
            'message' => 'Detail Data Admin',
            'data' => $user
        ]);
    }

    /**
     * Update the specified admin user in storage.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:6',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Data Admin berhasil diperbarui',
            'data' => $user
        ]);
    }

    /**
     * Remove the specified admin user from storage.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus akun Anda sendiri saat sedang login!'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun Admin berhasil dihapus'
        ]);
    }
}
