<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Association;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(6)],
            'association_name' => ['required', 'string', 'max:255'],
        ]);

        $association = Association::create([
            'name' => $data['association_name'],
            'slug' => Str::slug($data['association_name']) . '-' . Str::lower(Str::random(5)),
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'role' => 'association_admin',
        ]);

        Membership::create([
            'association_id' => $association->id,
            'user_id' => $user->id,
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Associação e administrador cadastrados com sucesso.',
            'token' => $token,
            'user' => $user,
            'association' => $association,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Usuário inativo.'
            ], 403);
        }

        $membership = Membership::with('association')
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if ($user->role !== 'super_admin') {
            if (!$membership) {
                return response()->json([
                    'message' => 'Usuário sem vínculo com associação.'
                ], 403);
            }

            if ($membership->status === 'pending') {
                return response()->json([
                    'message' => 'Seu cadastro está aguardando aprovação.'
                ], 403);
            }

            if ($membership->status === 'rejected') {
                return response()->json([
                    'message' => 'Seu cadastro foi rejeitado para esta comunidade.'
                ], 403);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token' => $token,
            'user' => $user,
            'membership' => $membership,
            'association' => $membership?->association,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $membership = Membership::with('association')
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        return response()->json([
            'user' => $user,
            'membership' => $membership,
            'association' => $membership?->association,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.'
        ]);
    }
}