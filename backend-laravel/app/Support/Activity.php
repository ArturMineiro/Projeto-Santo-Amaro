<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\Association;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Grava uma linha no registro de atividades.
 * Nunca derruba a operação principal: se o log falhar, só avisa no laravel.log.
 */
class Activity
{
    public static function record(
        string $action,
        string $description,
        ?Association $association = null,
        ?Model $subject = null,
        array $meta = [],
        ?User $user = null,
    ): void {
        try {
            $request = request();

            ActivityLog::create([
                'user_id' => ($user ?? $request?->user())?->id,
                'association_id' => $association?->id,
                'action' => $action,
                'description' => mb_substr($description, 0, 255),
                'subject_type' => $subject ? class_basename($subject) : null,
                'subject_id' => $subject?->getKey(),
                'ip' => $request?->ip(),
                'meta' => $meta ?: null,
            ]);
        } catch (Throwable $e) {
            Log::warning('Falha ao gravar atividade', ['action' => $action, 'error' => $e->getMessage()]);
        }
    }
}
