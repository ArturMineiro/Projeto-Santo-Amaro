<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MembershipResource;
use App\Models\Membership;
use App\Models\User;
use App\Rules\BrazilianPhone;
use App\Support\Activity;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Moradores da associação (administração).
 * O "morador" aqui é o vínculo (membership) — é ele que tem unidade e status.
 */
class ResidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = Membership::query()
            ->where('association_id', $this->association($request)->id)
            ->with('user')
            ->withCount(['packages as waiting_packages_count' => fn ($q) => $q->waiting()])
            ->where('status', $data['status'] ?? Membership::STATUS_APPROVED);

        if ($search = trim($data['search'] ?? '')) {
            $digits = preg_replace('/\D+/', '', $search);

            $query->where(function ($q) use ($search, $digits) {
                $q->where('unit', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search, $digits) {
                        $u->where('name', 'like', "%{$search}%");
                        if (strlen($digits) >= 3) {
                            $u->orWhere('phone', 'like', "%{$digits}%");
                        }
                    });
            });
        }

        $memberships = $query->get()->sortBy(fn ($m) => mb_strtolower($m->user->name))->values();

        return response()->json(['data' => MembershipResource::collection($memberships)]);
    }

    /**
     * A administração cadastra o morador direto (já aprovado).
     * Se o telefone já existe no sistema, apenas vincula a pessoa.
     */
    public function store(Request $request): JsonResponse
    {
        $association = $this->association($request);
        $request->merge(['phone' => Phone::normalize($request->input('phone'))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', new BrazilianPhone()],
            'email' => ['nullable', 'email', 'max:255'],
            'unit' => ['nullable', 'string', 'max:60'],
        ]);

        $user = User::where('phone', $data['phone'])->first();

        if ($user && Membership::where('association_id', $association->id)->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'phone' => "Este telefone já está cadastrado como {$user->name}.",
            ]);
        }

        if (! $user && ! empty($data['email']) && User::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages(['email' => 'Este email já está em uso por outra pessoa.']);
        }

        $membership = DB::transaction(function () use ($user, $data, $association, $request) {
            $user ??= User::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
            ]);

            return Membership::create([
                'association_id' => $association->id,
                'user_id' => $user->id,
                'role' => Membership::ROLE_RESIDENT,
                'status' => Membership::STATUS_APPROVED,
                'unit' => $data['unit'] ?? null,
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
            ]);
        });

        Activity::record('resident.created', "Morador cadastrado pela associação: {$membership->user->name}", $association, $membership);

        return response()->json([
            'message' => 'Morador cadastrado.',
            'resident' => new MembershipResource($membership->load('user')),
        ], 201);
    }

    public function show(Request $request, Membership $membership): MembershipResource
    {
        $this->authorizeMembership($request, $membership);

        return new MembershipResource(
            $membership->load('user')->loadCount(['packages as waiting_packages_count' => fn ($q) => $q->waiting()])
        );
    }

    public function update(Request $request, Membership $membership): JsonResponse
    {
        $this->authorizeMembership($request, $membership);
        $user = $membership->user;

        if ($request->has('phone')) {
            $request->merge(['phone' => Phone::normalize($request->input('phone'))]);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'required', new BrazilianPhone(), Rule::unique('users', 'phone')->ignore($user->id)],
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'unit' => ['sometimes', 'nullable', 'string', 'max:60'],
            'role' => ['sometimes', Rule::in([Membership::ROLE_ADMIN, Membership::ROLE_RESIDENT])],
        ], [
            'phone.unique' => 'Este telefone já pertence a outra pessoa.',
        ]);

        if (isset($data['role']) && $data['role'] !== Membership::ROLE_ADMIN) {
            $this->ensureNotLastAdmin($membership);
        }

        // Dados pessoais só podem ser editados se a pessoa ainda não criou acesso
        // (depois disso, quem edita é o próprio morador no perfil).
        $userData = array_intersect_key($data, array_flip(['name', 'phone', 'email']));
        if ($userData && $user->hasPassword()) {
            $userData = array_intersect_key($userData, array_flip(['name']));
        }

        DB::transaction(function () use ($membership, $user, $data, $userData) {
            if ($userData) {
                $user->update($userData);
            }
            $membership->update(array_intersect_key($data, array_flip(['unit', 'role'])));
        });

        if (isset($data['role']) && $membership->wasChanged('role')) {
            $this->log($request, 'resident.role_changed', $data['role'] === Membership::ROLE_ADMIN ? 'Passou a fazer parte da administração' : 'Saiu da administração', $membership);
        }

        return response()->json([
            'message' => 'Dados do morador atualizados.',
            'resident' => new MembershipResource($membership->fresh('user')),
        ]);
    }

    public function destroy(Request $request, Membership $membership): JsonResponse
    {
        $this->authorizeMembership($request, $membership);
        $this->ensureNotLastAdmin($membership);

        if ($membership->packages()->waiting()->exists()) {
            throw ValidationException::withMessages([
                'membership' => 'Este morador tem encomendas aguardando retirada. Entregue-as antes de remover.',
            ]);
        }

        $this->log($request, 'resident.removed', 'Removido da associação', $membership);
        $membership->delete();

        return response()->json(['message' => 'Morador removido da associação.']);
    }

    public function approve(Request $request, Membership $membership): JsonResponse
    {
        $this->authorizeMembership($request, $membership);
        $membership->approve($request->user());
        $this->log($request, 'resident.approved', 'Cadastro aprovado', $membership);

        return response()->json([
            'message' => 'Cadastro aprovado.',
            'resident' => new MembershipResource($membership->fresh('user')),
        ]);
    }

    public function reject(Request $request, Membership $membership): JsonResponse
    {
        $this->authorizeMembership($request, $membership);
        $this->ensureNotLastAdmin($membership);

        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:255'],
        ]);

        $membership->update([
            'status' => Membership::STATUS_REJECTED,
            'approved_at' => null,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        $this->log($request, 'resident.rejected', 'Cadastro recusado', $membership);

        return response()->json([
            'message' => 'Cadastro recusado.',
            'resident' => new MembershipResource($membership->fresh('user')),
        ]);
    }

    private function log(Request $request, string $action, string $text, Membership $membership): void
    {
        $membership->loadMissing('user');
        Activity::record($action, "{$text}: {$membership->user?->name}", $this->association($request), $membership);
    }

    private function authorizeMembership(Request $request, Membership $membership): void
    {
        // Evita que uma associação mexa em moradores de outra (IDs são sequenciais)
        abort_unless((int) $membership->association_id === (int) $this->association($request)->id, 404);
    }

    private function ensureNotLastAdmin(Membership $membership): void
    {
        if (! $membership->isAdmin()) {
            return;
        }

        $admins = Membership::where('association_id', $membership->association_id)
            ->where('role', Membership::ROLE_ADMIN)
            ->approved()
            ->count();

        if ($admins <= 1) {
            throw ValidationException::withMessages([
                'role' => 'A associação precisa ter pelo menos uma pessoa na administração.',
            ]);
        }
    }
}
