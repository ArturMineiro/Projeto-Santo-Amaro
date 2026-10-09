<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Association;
use App\Models\Membership;
use App\Models\Package;
use App\Models\PackageNotification;
use App\Models\User;
use App\Services\AppLogReader;
use App\Support\Activity;
use App\Support\Phone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use PDO;
use Throwable;

/**
 * Painel da administração do sistema (super admin): enxerga todas as associações.
 */
class SystemController extends Controller
{
    /** Números gerais + informações técnicas do servidor. */
    public function overview(AppLogReader $log): JsonResponse
    {
        $since7 = now()->subDays(7);
        $todayStart = now(config('app.local_timezone'))->startOfDay()->utc();

        $notifications = PackageNotification::where('created_at', '>=', $since7)
            ->selectRaw('channel, status, provider, count(*) as total')
            ->groupBy('channel', 'status', 'provider')
            ->get();

        $count = fn (callable $filter) => (int) $notifications->filter($filter)->sum('total');

        // Encomendas por dia (14 dias). DATE() funciona em MySQL e SQLite.
        $perDay = Package::where('arrived_at', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw('DATE(arrived_at) as day, count(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');
        $series = collect(range(13, 0))->map(function ($daysAgo) use ($perDay) {
            $day = now()->subDays($daysAgo)->toDateString();

            return ['day' => $day, 'total' => (int) ($perDay[$day] ?? 0)];
        });

        $totals = [
            'associations' => Association::count(),
            'associations_inactive' => Association::where('is_active', false)->count(),
            'users' => User::count(),
            'users_without_access' => User::whereNull('password')->count(),
            'memberships_approved' => Membership::approved()->count(),
            'memberships_pending' => Membership::where('status', Membership::STATUS_PENDING)->count(),
            'memberships_rejected' => Membership::where('status', Membership::STATUS_REJECTED)->count(),
            'admins' => Membership::approved()->where('role', Membership::ROLE_ADMIN)->count(),
            'packages' => Package::count(),
            'packages_waiting' => Package::waiting()->count(),
            'packages_waiting_over_7_days' => Package::waiting()->where('arrived_at', '<', $since7)->count(),
            'packages_today' => Package::where('arrived_at', '>=', $todayStart)->count(),
        ];

        $notificationStats = [
            'whatsapp_sent' => $count(fn ($n) => $n->channel === 'whatsapp' && $n->status === 'sent' && $n->provider !== PackageNotification::PROVIDER_MANUAL),
            'whatsapp_manual' => $count(fn ($n) => $n->provider === PackageNotification::PROVIDER_MANUAL),
            'whatsapp_failed' => $count(fn ($n) => $n->channel === 'whatsapp' && $n->status === 'failed'),
            'email_sent' => $count(fn ($n) => $n->channel === 'email' && $n->status === 'sent'),
            'email_failed' => $count(fn ($n) => $n->channel === 'email' && $n->status === 'failed'),
        ];

        $system = $this->systemInfo($log);

        return response()->json([
            'totals' => $totals,
            'notifications_7d' => $notificationStats,
            'packages_per_day' => $series,
            'busiest' => Association::withCount(['packages as waiting_count' => fn ($q) => $q->waiting()])
                ->orderByDesc('waiting_count')
                ->limit(5)
                ->get(['id', 'name'])
                ->filter(fn ($a) => $a->waiting_count > 0)
                ->values(),
            'system' => $system,
            'warnings' => $this->warnings($system, $notificationStats),
        ]);
    }

    public function associations(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = Association::query()
            ->withCount([
                'memberships as residents_count' => fn ($q) => $q->approved(),
                'memberships as pending_count' => fn ($q) => $q->where('status', Membership::STATUS_PENDING),
                'packages as packages_count',
                'packages as waiting_count' => fn ($q) => $q->waiting(),
            ])
            ->withMax('packages as last_package_at', 'arrived_at');

        if (($data['status'] ?? null) === 'active') {
            $query->where('is_active', true);
        } elseif (($data['status'] ?? null) === 'inactive') {
            $query->where('is_active', false);
        }

        if ($search = trim($data['search'] ?? '')) {
            $digits = preg_replace('/\D+/', '', $search);
            $query->where(function (Builder $q) use ($search, $digits) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('invite_code', strtoupper($search))
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    // Busca também pelo nome/telefone de quem administra
                    ->orWhereHas('memberships', fn ($m) => $m->where('role', Membership::ROLE_ADMIN)
                        ->whereHas('user', function ($u) use ($search, $digits) {
                            $u->where('name', 'like', "%{$search}%");
                            if (strlen($digits) >= 4) {
                                $u->orWhere('phone', 'like', "%{$digits}%");
                            }
                        }));
                if (strlen($digits) >= 4) {
                    $q->orWhere('phone', 'like', "%{$digits}%");
                }
            });
        }

        $page = $query->orderBy('name')->paginate(20);

        return response()->json([
            'data' => collect($page->items())->map(fn (Association $a) => $this->associationRow($a)),
            'meta' => $this->meta($page),
        ]);
    }

    public function showAssociation(Association $association): JsonResponse
    {
        $association->loadCount([
            'memberships as residents_count' => fn ($q) => $q->approved(),
            'memberships as pending_count' => fn ($q) => $q->where('status', Membership::STATUS_PENDING),
            'packages as packages_count',
            'packages as waiting_count' => fn ($q) => $q->waiting(),
        ])->loadMax('packages as last_package_at', 'arrived_at');

        $memberships = $association->memberships()
            ->with('user')
            ->withCount(['packages as waiting_packages_count' => fn ($q) => $q->waiting()])
            ->get()
            ->sortBy([['role', 'asc'], [fn ($m) => mb_strtolower($m->user->name), 'asc']])
            ->values();

        $failed = PackageNotification::whereHas('package', fn ($q) => $q->where('association_id', $association->id))
            ->where('status', PackageNotification::STATUS_FAILED)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        return response()->json([
            ...$this->associationRow($association),
            'invite_code' => $association->invite_code,
            'pickup_hours' => $association->pickup_hours,
            'created_at' => $association->created_at?->toIso8601String(),
            'failed_notifications_30d' => $failed,
            'memberships' => $memberships->map(fn (Membership $m) => $this->membershipRow($m, withAssociation: false)),
            'recent_activity' => ActivityLog::with('user')
                ->where('association_id', $association->id)
                ->latest('id')
                ->limit(20)
                ->get()
                ->map(fn ($a) => $this->activityRow($a)),
        ]);
    }

    /** Ativar / desativar uma associação. Desativada, ninguém dela consegue usar o painel. */
    public function updateAssociation(Request $request, Association $association): JsonResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);

        $association->update($data);

        Activity::record(
            $data['is_active'] ? 'association.activated' : 'association.deactivated',
            ($data['is_active'] ? 'Associação reativada: ' : 'Associação desativada: ') . $association->name,
            $association,
            $association,
        );

        return response()->json([
            'message' => $data['is_active'] ? 'Associação reativada.' : 'Associação desativada.',
            'association' => $this->associationRow($association),
        ]);
    }

    /** Vínculos pessoa ↔ associação de todo o sistema. */
    public function memberships(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'role' => ['nullable', Rule::in(['admin', 'resident'])],
            'association_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = Membership::query()->with(['user', 'association']);

        foreach (['status', 'role', 'association_id'] as $filter) {
            if (! empty($data[$filter])) {
                $query->where($filter, $data[$filter]);
            }
        }

        if ($search = trim($data['search'] ?? '')) {
            $digits = preg_replace('/\D+/', '', $search);
            $query->where(function (Builder $q) use ($search, $digits) {
                $q->where('unit', 'like', "%{$search}%")
                    ->orWhereHas('association', fn ($a) => $a->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('user', function ($u) use ($search, $digits) {
                        $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
                        if (strlen($digits) >= 4) {
                            $u->orWhere('phone', 'like', "%{$digits}%");
                        }
                    });
            });
        }

        $page = $query->latest('id')->paginate(30);

        return response()->json([
            'data' => collect($page->items())->map(fn (Membership $m) => $this->membershipRow($m)),
            'meta' => $this->meta($page),
        ]);
    }

    /** Registro de atividades (quem fez o quê). */
    public function activity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'action' => ['nullable', 'string', 'max:60'],
            'association_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = ActivityLog::query()->with(['user', 'association']);

        if (! empty($data['action'])) {
            // "package" pega package.created, package.picked_up...
            $query->where('action', 'like', $data['action'] . '%');
        }
        if (! empty($data['association_id'])) {
            $query->where('association_id', $data['association_id']);
        }
        if ($search = trim($data['search'] ?? '')) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('ip', $search)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        $page = $query->latest('id')->paginate(50);

        return response()->json([
            'data' => collect($page->items())->map(fn ($a) => $this->activityRow($a)),
            'meta' => $this->meta($page),
        ]);
    }

    /** Histórico de avisos (WhatsApp/email) de todas as associações. */
    public function notifications(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in(['sent', 'failed'])],
            'channel' => ['nullable', Rule::in(['whatsapp', 'email'])],
            'association_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = PackageNotification::query()->with(['package.association', 'package.resident']);

        foreach (['status', 'channel'] as $filter) {
            if (! empty($data[$filter])) {
                $query->where($filter, $data[$filter]);
            }
        }
        if (! empty($data['association_id'])) {
            $query->whereHas('package', fn ($q) => $q->where('association_id', $data['association_id']));
        }

        $page = $query->latest('id')->paginate(50);

        return response()->json([
            'data' => collect($page->items())->map(fn (PackageNotification $n) => [
                'id' => $n->id,
                'channel' => $n->channel,
                'status' => $n->status,
                'provider' => $n->provider,
                'recipient' => $n->channel === 'whatsapp' ? Phone::format($n->recipient) : $n->recipient,
                'error' => $n->error,
                'created_at' => $n->created_at?->toIso8601String(),
                'package_id' => $n->package_id,
                'resident' => $n->package?->resident?->name,
                'association' => $n->package?->association
                    ? ['id' => $n->package->association->id, 'name' => $n->package->association->name]
                    : null,
            ]),
            'meta' => $this->meta($page),
        ]);
    }

    /** Final do arquivo storage/logs/laravel.log. */
    public function appLog(Request $request, AppLogReader $log): JsonResponse
    {
        $data = $request->validate([
            'level' => ['nullable', Rule::in(['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'])],
            'search' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:10', 'max:300'],
        ]);

        return response()->json([
            'size' => $log->size(),
            'data' => $log->entries($data['limit'] ?? 100, $data['level'] ?? null, $data['search'] ?? null),
        ]);
    }

    // ------------------------------------------------------------------

    private function systemInfo(AppLogReader $log): array
    {
        $db = DB::connection();
        try {
            $dbVersion = $db->getPdo()->getAttribute(PDO::ATTR_SERVER_VERSION);
        } catch (Throwable) {
            $dbVersion = null;
        }

        $storage = storage_path();
        $countTable = fn (string $table) => Schema::hasTable($table) ? DB::table($table)->count() : null;

        return [
            'app_name' => config('app.name'),
            'environment' => app()->environment(),
            'debug' => (bool) config('app.debug'),
            'url' => config('app.url'),
            'timezone' => config('app.local_timezone'),
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
            'database' => $db->getDriverName() . ($dbVersion ? " {$dbVersion}" : ''),
            'whatsapp_driver' => config('services.whatsapp.driver') ?: 'none',
            'mail_mailer' => config('mail.default'),
            'queue_connection' => config('queue.default'),
            'queue_pending' => $countTable('jobs'),
            'queue_failed' => $countTable('failed_jobs'),
            'migrations' => $countTable('migrations'),
            'disk_free' => @disk_free_space($storage) ?: null,
            'disk_total' => @disk_total_space($storage) ?: null,
            'log_size' => $log->size(),
            'server_time' => now()->toIso8601String(),
        ];
    }

    /** Coisas que merecem atenção, em linguagem simples. */
    private function warnings(array $system, array $notifications): array
    {
        $warnings = [];

        if ($system['environment'] === 'production' && $system['debug']) {
            $warnings[] = ['tone' => 'error', 'text' => 'APP_DEBUG está ligado em produção: erros mostram detalhes internos. Desligue no .env.'];
        }
        if ($system['mail_mailer'] === 'log') {
            $warnings[] = ['tone' => 'warning', 'text' => 'Os emails só estão sendo gravados no log (MAIL_MAILER=log). Configure SMTP para enviar de verdade.'];
        }
        if ($system['whatsapp_driver'] === 'log') {
            $warnings[] = ['tone' => 'warning', 'text' => 'O WhatsApp está em modo de teste (WHATSAPP_DRIVER=log): nada é enviado.'];
        }
        if ($notifications['whatsapp_failed'] + $notifications['email_failed'] > 0) {
            $warnings[] = ['tone' => 'error', 'text' => 'Houve avisos que falharam nos últimos 7 dias. Veja em Logs, aba Avisos.'];
        }
        if (($system['queue_failed'] ?? 0) > 0) {
            $warnings[] = ['tone' => 'error', 'text' => "Há {$system['queue_failed']} tarefa(s) com falha na fila (failed_jobs)."];
        }
        if ($system['disk_free'] && $system['disk_total'] && $system['disk_free'] / $system['disk_total'] < 0.1) {
            $warnings[] = ['tone' => 'error', 'text' => 'Menos de 10% de espaço livre em disco no servidor.'];
        }

        return $warnings;
    }

    private function associationRow(Association $a): array
    {
        return [
            'id' => $a->id,
            'name' => $a->name,
            'slug' => $a->slug,
            'is_active' => $a->is_active,
            'phone' => $a->phone ? Phone::format($a->phone) : null,
            'email' => $a->email,
            'address' => $a->address,
            'residents_count' => (int) ($a->residents_count ?? 0),
            'pending_count' => (int) ($a->pending_count ?? 0),
            'packages_count' => (int) ($a->packages_count ?? 0),
            'waiting_count' => (int) ($a->waiting_count ?? 0),
            'last_package_at' => $a->last_package_at ? \Illuminate\Support\Carbon::parse($a->last_package_at)->toIso8601String() : null,
        ];
    }

    private function membershipRow(Membership $m, bool $withAssociation = true): array
    {
        return [
            'id' => $m->id,
            'role' => $m->role,
            'status' => $m->status,
            'unit' => $m->unit,
            'created_at' => $m->created_at?->toIso8601String(),
            'approved_at' => $m->approved_at?->toIso8601String(),
            'waiting_packages' => isset($m->waiting_packages_count) ? (int) $m->waiting_packages_count : null,
            'user' => [
                'id' => $m->user->id,
                'name' => $m->user->name,
                'phone_formatted' => Phone::format($m->user->phone),
                'email' => $m->user->email,
                'has_access' => $m->user->hasPassword(),
                'is_active' => $m->user->is_active,
            ],
            'association' => $withAssociation && $m->association
                ? ['id' => $m->association->id, 'name' => $m->association->name, 'is_active' => $m->association->is_active]
                : null,
        ];
    }

    private function activityRow(ActivityLog $a): array
    {
        return [
            'id' => $a->id,
            'action' => $a->action,
            'description' => $a->description,
            'ip' => $a->ip,
            'meta' => $a->meta,
            'created_at' => $a->created_at?->toIso8601String(),
            'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
            'association' => $a->relationLoaded('association') && $a->association
                ? ['id' => $a->association->id, 'name' => $a->association->name]
                : null,
        ];
    }

    private function meta($page): array
    {
        return [
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'total' => $page->total(),
            'per_page' => $page->perPage(),
        ];
    }
}
