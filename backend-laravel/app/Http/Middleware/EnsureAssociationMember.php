<?php

namespace App\Http\Middleware;

use App\Models\Membership;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Descobre em qual associação o usuário está atuando e garante que o
 * vínculo está aprovado. O front pode mandar o header X-Association-Id
 * quando a pessoa participa de mais de uma comunidade.
 *
 * Uso: ->middleware('association')        qualquer membro aprovado
 *      ->middleware('association:admin')  só administradores
 */
class EnsureAssociationMember
{
    public function handle(Request $request, Closure $next, ?string $role = null): Response
    {
        $user = $request->user();

        $query = Membership::with('association')
            ->where('user_id', $user->id)
            ->approved()
            ->whereHas('association', fn ($q) => $q->where('is_active', true));

        if ($associationId = $request->header('X-Association-Id')) {
            $query->where('association_id', (int) $associationId);
        }

        // Prioriza vínculo de admin quando não há header
        $membership = $query->orderByRaw("CASE WHEN role = 'admin' THEN 0 ELSE 1 END")
            ->oldest('id')
            ->first();

        if (! $membership) {
            return response()->json([
                'message' => 'Você ainda não faz parte de uma associação aprovada.',
            ], 403);
        }

        if ($role === 'admin' && ! $membership->isAdmin()) {
            return response()->json([
                'message' => 'Apenas a administração da associação pode fazer isso.',
            ], 403);
        }

        $request->attributes->set('membership', $membership);
        $request->attributes->set('association', $membership->association);

        return $next($request);
    }
}
