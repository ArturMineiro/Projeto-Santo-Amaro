<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MembershipResource;
use App\Http\Resources\UserResource;
use App\Models\Association;
use App\Models\Membership;
use App\Models\User;
use App\Rules\BrazilianPhone;
use App\Support\Activity;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Cria a associação e a pessoa que vai administrá-la. */
    public function registerAssociation(Request $request): JsonResponse
    {
        $request->merge(['phone' => Phone::normalize($request->input('phone'))]);

        $data = $request->validate([
            'association_name' => ['required', 'string', 'max:120'],
            'pickup_hours' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', new BrazilianPhone(), 'unique:users,phone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(6)],
        ], [
            'phone.unique' => 'Este telefone já tem cadastro. Entre com ele.',
            'email.unique' => 'Este email já tem cadastro.',
        ]);

        [$user, $membership] = DB::transaction(function () use ($data) {
            $association = Association::create([
                'name' => $data['association_name'],
                'slug' => Association::generateSlug($data['association_name']),
                'invite_code' => Association::generateInviteCode(),
                'pickup_hours' => $data['pickup_hours'] ?? null,
                'address' => $data['address'] ?? null,
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
            ]);

            $user = User::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'password' => $data['password'],
            ]);

            $membership = Membership::create([
                'association_id' => $association->id,
                'user_id' => $user->id,
                'role' => Membership::ROLE_ADMIN,
                'status' => Membership::STATUS_APPROVED,
                'approved_at' => now(),
            ]);

            return [$user, $membership];
        });

        Activity::record('association.created', "Associação criada: {$membership->association->name}", $membership->association, $membership->association, user: $user);

        return $this->sessionResponse($request, $user, 'Associação criada. Bem-vindo!', 201, $membership);
    }

    /**
     * Cadastro do morador com o código da associação.
     * Se a associação já tinha cadastrado o telefone (sem senha), a pessoa
     * "ativa" a conta e herda o vínculo já aprovado.
     */
    public function registerResident(Request $request): JsonResponse
    {
        $request->merge([
            'phone' => Phone::normalize($request->input('phone')),
            'invite_code' => strtoupper(trim((string) $request->input('invite_code'))),
        ]);

        $data = $request->validate([
            'invite_code' => ['required', 'string', Rule::exists('associations', 'invite_code')->where('is_active', true)],
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', new BrazilianPhone()],
            'email' => ['nullable', 'email', 'max:255'],
            'unit' => ['nullable', 'string', 'max:60'],
            'password' => ['required', 'confirmed', Password::min(6)],
        ], [
            'invite_code.exists' => 'Código da associação não encontrado. Confira com a administração.',
        ]);

        $association = Association::where('invite_code', $data['invite_code'])->firstOrFail();
        $user = User::where('phone', $data['phone'])->first();

        if ($user?->hasPassword()) {
            throw ValidationException::withMessages([
                'phone' => 'Este telefone já tem cadastro. Entre com ele.',
            ]);
        }

        if (! empty($data['email']) && User::where('email', $data['email'])->where('id', '!=', $user?->id)->exists()) {
            throw ValidationException::withMessages(['email' => 'Este email já está em uso.']);
        }

        $membership = DB::transaction(function () use (&$user, $data, $association) {
            if ($user) {
                $user->update([
                    'name' => $data['name'],
                    'email' => $data['email'] ?? $user->email,
                    'password' => $data['password'],
                ]);
            } else {
                $user = User::create([
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'email' => $data['email'] ?? null,
                    'password' => $data['password'],
                ]);
            }

            $membership = Membership::firstOrCreate(
                ['association_id' => $association->id, 'user_id' => $user->id],
                ['role' => Membership::ROLE_RESIDENT, 'status' => Membership::STATUS_PENDING, 'unit' => $data['unit'] ?? null],
            );

            if (! $membership->unit && ! empty($data['unit'])) {
                $membership->update(['unit' => $data['unit']]);
            }

            return $membership;
        });

        $message = $membership->isApproved()
            ? 'Cadastro concluído! Você já pode acompanhar suas encomendas.'
            : 'Cadastro enviado! A associação vai confirmar em breve.';

        Activity::record(
            'resident.signed_up',
            "{$user->name} se cadastrou com o código" . ($membership->isApproved() ? ' (já estava cadastrado pela associação)' : ''),
            $association,
            $membership,
            user: $user,
        );

        return $this->sessionResponse($request, $user, $message, 201, $membership);
    }

    /** Login por telefone (ou email) + senha. */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        $login = trim($data['login']);
        $user = str_contains($login, '@')
            ? User::where('email', $login)->first()
            : User::where('phone', Phone::normalize($login))->first();

        if (! $user || ! $user->hasPassword() || ! Hash::check($data['password'], $user->password)) {
            // Não grava a senha; o login aparece mascarado
            Activity::record('auth.login_failed', 'Tentativa de entrar com senha errada: ' . $this->maskLogin($login), user: $user);

            throw ValidationException::withMessages([
                'login' => 'Telefone ou senha incorretos.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => 'Este acesso foi desativado. Fale com a associação.',
            ]);
        }

        Activity::record('auth.login', "{$user->name} entrou", user: $user);

        return $this->sessionResponse($request, $user, 'Que bom te ver!');
    }

    /** "5511999998888" -> "55119****8888", "ana@x.com" -> "an***@x.com" */
    private function maskLogin(string $login): string
    {
        if (str_contains($login, '@')) {
            [$name, $domain] = explode('@', $login, 2);

            return mb_substr($name, 0, 2) . '***@' . $domain;
        }

        $digits = Phone::normalize($login);

        return strlen($digits) > 8 ? substr($digits, 0, 5) . str_repeat('*', strlen($digits) - 9) . substr($digits, -4) : '***';
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->sessionPayload($request->user()));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->has('phone')) {
            $request->merge(['phone' => Phone::normalize($request->input('phone'))]);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'required', new BrazilianPhone(), Rule::unique('users', 'phone')->ignore($user->id)],
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'notify_whatsapp' => ['sometimes', 'boolean'],
            'notify_email' => ['sometimes', 'boolean'],
            'current_password' => ['required_with:password', 'current_password'],
            'password' => ['sometimes', 'confirmed', Password::min(6)],
        ], [
            'current_password.current_password' => 'A senha atual não confere.',
        ]);

        unset($data['current_password']);
        $user->update($data);

        return response()->json([
            'message' => 'Dados atualizados.',
            ...$this->sessionPayload($user->fresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Você saiu da sua conta.']);
    }

    /** Usado na tela de cadastro para mostrar "Você está entrando na Associação X". */
    public function lookupInvite(string $code): JsonResponse
    {
        $association = Association::where('invite_code', strtoupper(trim($code)))
            ->where('is_active', true)
            ->first();

        if (! $association) {
            return response()->json(['message' => 'Código não encontrado.'], 404);
        }

        return response()->json([
            'name' => $association->name,
            'pickup_hours' => $association->pickup_hours,
        ]);
    }

    private function sessionResponse(Request $request, User $user, string $message, int $status = 200, ?Membership $membership = null): JsonResponse
    {
        $token = $user->createToken($request->userAgent() ? mb_substr($request->userAgent(), 0, 100) : 'app')->plainTextToken;

        return response()->json([
            'message' => $message,
            'token' => $token,
            ...$this->sessionPayload($user),
        ], $status);
    }

    /** Dados de sessão: usuário + todos os vínculos (o front decide a tela). */
    private function sessionPayload(User $user): array
    {
        $memberships = $user->memberships()
            ->with('association')
            ->orderByRaw("CASE WHEN status = 'approved' THEN 0 WHEN status = 'pending' THEN 1 ELSE 2 END")
            ->orderByRaw("CASE WHEN role = 'admin' THEN 0 ELSE 1 END")
            ->get();

        return [
            'user' => new UserResource($user),
            'memberships' => MembershipResource::collection($memberships),
        ];
    }
}
