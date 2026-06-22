<?php

namespace App\Http\Requests;

use App\Models\Support;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->active === true;
    }

    public function rules(): array
    {
        return [
            'nit' => ['sometimes', 'nullable', 'string', 'max:80'],
            'empresa' => ['sometimes', 'string', 'max:180'],
            'detalles_soporte' => ['sometimes', 'string', 'max:6000'],
            'telefono' => ['sometimes', 'string', 'max:40'],
            'anydesk' => ['sometimes', 'nullable', 'string', 'max:240'],
            'observacion_tecnico' => ['sometimes', 'nullable', 'string', 'max:6000'],
            'estado_soporte' => ['sometimes', Rule::in(Support::STATES)],
            'tecnico_asignado_id' => ['sometimes', 'nullable', Rule::exists('users', 'id')->where('role', 'tecnico')->where('active', true)],
        ];
    }
}
