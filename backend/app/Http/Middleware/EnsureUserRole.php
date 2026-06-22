<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->active || ! in_array($user->role, $roles, true)) {
            abort(403, 'No autorizado para esta accion.');
        }

        return $next($request);
    }
}
