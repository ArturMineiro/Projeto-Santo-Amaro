<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function approve(Request $request, Membership $membership): JsonResponse
    {
        $membership->update([
            'status' => 'approved',
            'approved_at' => now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Morador aprovado com sucesso.',
            'membership' => $membership,
        ]);
    }

    public function reject(Request $request, Membership $membership): JsonResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string'],
        ]);

        $membership->update([
            'status' => 'rejected',
            'approved_at' => null,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        return response()->json([
            'message' => 'Morador rejeitado com sucesso.',
            'membership' => $membership,
        ]);
    }
}