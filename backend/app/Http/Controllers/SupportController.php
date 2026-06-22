<?php

namespace App\Http\Controllers;

use App\Events\SupportCellUpdated;
use App\Events\SupportCreated;
use App\Events\SupportUpdated;
use App\Http\Requests\StoreSupportRequest;
use App\Http\Requests\UpdateSupportCellRequest;
use App\Http\Requests\UpdateSupportRequest;
use App\Models\Support;
use App\Support\SupportErrorImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SupportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min(max((int) $request->input('per_page', 50), 1), 100);
        $query = Support::query()
            ->with('technician');

        if (! $request->filled('desde') && ! $request->filled('hasta')) {
            $query->where(function ($q) {
                $q->whereDate('fecha', today())
                    ->orWhere('estado_soporte', '!=', 'finalizado');
            });
        }

        if ($user->role === 'tecnico') {
            $query->where('tecnico_asignado_id', $user->id);
        }

        $query->when($request->filled('estado'), fn ($q) => $q->where('estado_soporte', $request->estado))
            ->when($request->filled('tecnico_id'), fn ($q) => $q->where('tecnico_asignado_id', $request->tecnico_id))
            ->when($request->filled('empresa'), fn ($q) => $q->where('empresa', 'like', '%'.$request->empresa.'%'))
            ->when($request->filled('desde'), fn ($q) => $q->whereDate('fecha', '>=', $request->desde))
            ->when($request->filled('hasta'), fn ($q) => $q->whereDate('fecha', '<=', $request->hasta))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->q.'%';
                $q->where(function ($inner) use ($term) {
                    $inner->where('nit', 'like', $term)
                        ->orWhere('empresa', 'like', $term)
                        ->orWhere('telefono', 'like', $term)
                        ->orWhere('anydesk', 'like', $term)
                        ->orWhere('codigo_soporte', 'like', $term);
                });
            })
            ->orderBy('fecha')
            ->orderBy('id');

        $statsBase = Support::query();
        if (! $request->filled('desde') && ! $request->filled('hasta')) {
            $statsBase->where(function ($q) {
                $q->whereDate('fecha', today())
                    ->orWhere('estado_soporte', '!=', 'finalizado');
            });
        }

        if ($user->role === 'tecnico') {
            $statsBase->where('tecnico_asignado_id', $user->id);
        }

        $stats = (clone $statsBase)
            ->selectRaw("SUM(CASE WHEN estado_soporte = 'pendiente' THEN 1 ELSE 0 END) as pendiente")
            ->selectRaw("SUM(CASE WHEN estado_soporte = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso")
            ->selectRaw('COUNT(*) as total')
            ->first();

        return response()->json([
            'supports' => $query->paginate($perPage),
            'stats' => [
                'pendiente' => (int) ($stats->pendiente ?? 0),
                'en_proceso' => (int) ($stats->en_proceso ?? 0),
                'total' => (int) ($stats->total ?? 0),
            ],
        ]);
    }

    public function store(StoreSupportRequest $request): JsonResponse
    {
        $this->assertAdminCanAssign($request);

        $support = DB::transaction(function () use ($request) {
            $data = $this->cleanSupportData($request->validated());
            $data['fecha'] ??= now()->toDateString();
            $data['hora_registro'] = now()->format('H:i');
            $data['estado_soporte'] ??= ! empty($data['tecnico_asignado_id']) ? 'asignado' : 'pendiente';
            $data['codigo_soporte'] = $this->temporarySupportCode();
            $imagePaths = SupportErrorImageStorage::storeFromRequest($request);
            $data['error_image_path'] = $imagePaths[0] ?? null;
            $data['error_image_paths'] = $imagePaths ?: null;
            unset($data['error_image'], $data['error_images']);

            $support = Support::create($data);
            $support->forceFill(['codigo_soporte' => $this->supportCode($support)])->save();
            $support->logs()->create([
                'user_id' => $request->user()->id,
                'action' => 'created',
                'new_value' => json_encode($support->fresh()->toArray()),
            ]);

            return $support->load('technician');
        });

        event(new SupportCreated($support));

        return response()->json(['support' => $support], 201);
    }

    public function companySuggestions(Request $request): JsonResponse
    {
        $term = trim((string) $request->input('q', ''));

        if (mb_strlen($term) < 2) {
            return response()->json(['companies' => []]);
        }

        $user = $request->user();
        $likeTerm = '%'.$term.'%';
        $query = Support::query()
            ->select(['empresa', 'nit', 'telefono', 'anydesk', 'updated_at', 'id'])
            ->where(function ($q) use ($likeTerm) {
                $q->where('empresa', 'like', $likeTerm)
                    ->orWhere('nit', 'like', $likeTerm);
            })
            ->whereNotNull('empresa')
            ->where('empresa', '!=', '');

        if ($user->role === 'tecnico') {
            $query->where('tecnico_asignado_id', $user->id);
        }

        $companies = $query
            ->latest('updated_at')
            ->latest('id')
            ->limit(50)
            ->get()
            ->unique(fn (Support $support) => mb_strtolower(trim((string) ($support->nit ?: $support->empresa))))
            ->take(8)
            ->map(fn (Support $support) => [
                'empresa' => $support->empresa,
                'nit' => $support->nit,
                'telefono' => $support->telefono,
                'anydesk' => $support->anydesk,
            ])
            ->values();

        return response()->json(['companies' => $companies]);
    }

    public function show(Request $request, Support $support): JsonResponse
    {
        $this->authorizeSupportAccess($request, $support);

        return response()->json([
            'support' => $support->load(['technician', 'logs.user']),
        ]);
    }

    public function update(UpdateSupportRequest $request, Support $support): JsonResponse
    {
        $this->authorizeSupportAccess($request, $support);
        $this->assertAdminCanAssign($request);

        $data = $this->cleanSupportData($request->validated());
        if ($request->user()->role === 'tecnico') {
            unset($data['tecnico_asignado_id']);
        }
        $this->applyStatusTimestamps($data, $support);

        foreach ($data as $field => $value) {
            if ((string) $support->{$field} !== (string) $value) {
                $support->logs()->create([
                    'user_id' => $request->user()->id,
                    'action' => 'updated',
                    'field_name' => $field,
                    'old_value' => $support->{$field},
                    'new_value' => $value,
                ]);
            }
        }

        $support->update($data);
        $support->load('technician');
        event(new SupportUpdated($support, $this->actor($request)));

        return response()->json(['support' => $support]);
    }

    public function updateCell(UpdateSupportCellRequest $request, Support $support): JsonResponse
    {
        $this->authorizeSupportAccess($request, $support);

        $field = (string) $request->input('field');
        if ($request->user()->role === 'tecnico' && $field === 'tecnico_asignado_id') {
            abort(403, 'El tecnico no puede reasignar soportes.');
        }

        $value = $this->normalizeCellValue($field, $request->input('value'));
        $old = $support->{$field};

        if ((string) $old !== (string) $value) {
            $data = [$field => $value];
            $this->applyStatusTimestamps($data, $support);
            $support->update($data);
            $support->logs()->create([
                'user_id' => $request->user()->id,
                'action' => 'cell_updated',
                'field_name' => $field,
                'old_value' => $old,
                'new_value' => $value,
            ]);
        }

        $support->load('technician');
        event(new SupportCellUpdated($support, $field, $support->{$field}, $this->actor($request)));

        return response()->json(['support' => $support, 'field' => $field, 'value' => $support->{$field}]);
    }

    public function destroy(Request $request, Support $support): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403, 'Solo administrador puede eliminar.');
        $support->delete();

        return response()->json(['message' => 'Soporte eliminado.']);
    }

    private function authorizeSupportAccess(Request $request, Support $support): void
    {
        if ($request->user()->role === 'tecnico' && $support->tecnico_asignado_id !== $request->user()->id) {
            abort(403, 'Este soporte no esta asignado a este tecnico.');
        }
    }

    private function assertAdminCanAssign(Request $request): void
    {
        if ($request->user()?->role !== 'administrador' && $request->has('tecnico_asignado_id')) {
            throw ValidationException::withMessages(['tecnico_asignado_id' => 'Solo administrador puede asignar tecnico.']);
        }
    }

    private function cleanSupportData(array $data): array
    {
        foreach (['nit', 'empresa', 'detalles_soporte', 'telefono', 'anydesk', 'observacion_tecnico'] as $field) {
            if (array_key_exists($field, $data) && is_string($data[$field])) {
                $data[$field] = trim(strip_tags($data[$field]));
            }
        }

        return $data;
    }

    private function applyStatusTimestamps(array &$data, Support $support): void
    {
        if (! array_key_exists('estado_soporte', $data) || $data['estado_soporte'] === $support->estado_soporte) {
            return;
        }

        if ($data['estado_soporte'] === 'en_proceso') {
            $data['hora_inicio'] = now()->format('H:i');
        }

        if ($data['estado_soporte'] === 'finalizado') {
            $data['hora_final'] = now()->format('H:i');
        }
    }

    private function normalizeCellValue(string $field, mixed $value): mixed
    {
        if ($value === '') {
            $value = null;
        }

        validator([$field => $value], $this->cellRules($field))->validate();

        if (is_string($value) && in_array($field, ['nit', 'empresa', 'detalles_soporte', 'telefono', 'anydesk', 'observacion_tecnico'], true)) {
            return trim(strip_tags($value));
        }

        return $value;
    }

    private function cellRules(string $field): array
    {
        return match ($field) {
            'estado_soporte' => [$field => ['required', 'in:'.implode(',', Support::STATES)]],
            'tecnico_asignado_id' => [$field => ['nullable', \Illuminate\Validation\Rule::exists('users', 'id')->where('role', 'tecnico')->where('active', true)]],
            'empresa', 'telefono' => [$field => ['required', 'string', 'max:180']],
            'detalles_soporte', 'observacion_tecnico' => [$field => ['nullable', 'string', 'max:6000']],
            'anydesk' => [$field => ['nullable', 'string', 'max:240']],
            default => [$field => ['nullable', 'string', 'max:180']],
        };
    }

    private function temporarySupportCode(): string
    {
        return 'TMP-'.Str::uuid()->toString();
    }

    private function supportCode(Support $support): string
    {
        return 'SOP-'.now()->format('Ymd').'-'.str_pad((string) $support->id, 4, '0', STR_PAD_LEFT);
    }

    private function actor(Request $request): array
    {
        return [
            'id' => $request->user()->id,
            'name' => $request->user()->name,
            'role' => $request->user()->role,
        ];
    }
}
