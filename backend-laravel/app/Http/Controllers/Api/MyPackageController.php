<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PackageResource;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Encomendas — visão do morador (só as próprias). */
class MyPackageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $base = Package::query()
            ->where('association_id', $this->association($request)->id)
            ->where('resident_id', $request->user()->id);

        $waiting = (clone $base)->waiting()->oldest('arrived_at')->get();

        $history = (clone $base)
            ->where('status', Package::STATUS_PICKED_UP)
            ->latest('picked_up_at')
            ->limit(50)
            ->get();

        return response()->json([
            'waiting' => PackageResource::collection($waiting),
            'history' => PackageResource::collection($history),
        ]);
    }
}
