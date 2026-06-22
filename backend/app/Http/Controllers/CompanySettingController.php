<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class CompanySettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'settings' => CompanySetting::current(),
            'technicians' => User::query()
                ->where('role', 'tecnico')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'phone', 'active']),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);

        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:180'],
            'support_phone' => ['nullable', 'string', 'max:40'],
            'support_email' => ['nullable', 'email', 'max:180'],
            'default_whatsapp_message' => ['nullable', 'string', 'max:500'],
            'business_hours' => ['nullable', 'string', 'max:1000'],
        ]);

        $settings = CompanySetting::current();
        $settings->update($data);
        CompanySetting::forgetCurrent();

        return response()->json(['settings' => $settings]);
    }

    public function updateTechnician(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);
        abort_unless($user->role === 'tecnico', 422, 'Solo se pueden actualizar tecnicos.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:40'],
            'active' => ['boolean'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        if (array_key_exists('active', $data) && ! (bool) $data['active']) {
            $user->assignedSupports()->update(['tecnico_asignado_id' => null]);
        }

        return response()->json(['technician' => $user->only(['id', 'name', 'email', 'phone', 'active'])]);
    }

    public function destroyTechnician(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);
        abort_unless($user->role === 'tecnico', 422, 'Solo se pueden eliminar tecnicos.');

        $user->assignedSupports()->update(['tecnico_asignado_id' => null]);
        $user->delete();

        return response()->json(['message' => 'Tecnico eliminado.']);
    }

    public function storeTechnician(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:40'],
            'active' => ['boolean'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $data['role'] = 'tecnico';
        $data['active'] = $data['active'] ?? true;
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json([
            'technician' => $user->only(['id', 'name', 'email', 'phone', 'active']),
        ], 201);
    }

    public function administrators(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);

        return response()->json([
            'administrators' => User::query()
                ->where('role', 'administrador')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'phone', 'active']),
        ]);
    }

    public function storeAdministrator(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:40'],
            'active' => ['boolean'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $data['role'] = 'administrador';
        $data['active'] = $data['active'] ?? true;
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json([
            'administrator' => $user->only(['id', 'name', 'email', 'phone', 'active']),
        ], 201);
    }

    public function updateAdministrator(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);
        abort_unless($user->role === 'administrador', 422, 'Solo se pueden actualizar administradores.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:40'],
            'active' => ['boolean'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        if ($request->user()->id === $user->id && array_key_exists('active', $data) && ! (bool) $data['active']) {
            abort(422, 'No puedes desactivar tu propia cuenta.');
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json(['administrator' => $user->only(['id', 'name', 'email', 'phone', 'active'])]);
    }

    public function destroyAdministrator(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->role === 'administrador', 403);
        abort_unless($user->role === 'administrador', 422, 'Solo se pueden eliminar administradores.');
        abort_if($request->user()->id === $user->id, 422, 'No puedes eliminar tu propia cuenta.');

        $user->delete();

        return response()->json(['message' => 'Administrador eliminado.']);
    }
}
