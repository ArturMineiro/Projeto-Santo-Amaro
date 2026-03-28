<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $membership = Membership::where('user_id', $user->id)->latest()->first();

        $query = Package::with(['resident', 'association'])
            ->where('association_id', $membership->association_id);

        if ($user->role === 'resident') {
            $query->where('resident_id', $user->id);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $membership = Membership::where('user_id', $user->id)
            ->where('status', 'approved')
            ->latest()
            ->first();

        $data = $request->validate([
            'resident_id' => ['required', 'exists:users,id'],
            'description' => ['required', 'string', 'max:255'],
            'tracking_code' => ['nullable', 'string', 'max:255'],
        ]);

        $package = Package::create([
            'association_id' => $membership->association_id,
            'resident_id' => $data['resident_id'],
            'received_by' => $user->id,
            'description' => $data['description'],
            'tracking_code' => $data['tracking_code'] ?? null,
            'status' => 'pending',
            'arrival_date' => now(),
        ]);

        return response()->json([
            'message' => 'Encomenda cadastrada com sucesso.',
            'package' => $package,
        ], 201);
    }

    public function updateStatus(Request $request, Package $package): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,notified,picked_up'],
        ]);

        $payload = ['status' => $data['status']];

        if ($data['status'] === 'notified') {
            $payload['notification_sent_at'] = now();
        }

        if ($data['status'] === 'picked_up') {
            $payload['picked_up_at'] = now();
        }

        $package->update($payload);

        return response()->json([
            'message' => 'Status atualizado com sucesso.',
            'package' => $package,
        ]);
    }
}