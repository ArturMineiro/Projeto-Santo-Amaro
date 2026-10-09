<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Só para quem administra o sistema inteiro (users.is_super_admin). */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_super_admin) {
            return response()->json(['message' => 'Área restrita à administração do sistema.'], 403);
        }

        return $next($request);
    }
}
