<?php

namespace App\Http\Requests;

use App\Models\Support;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->active === true;
    }

    public function rules(): array
    {
        return [
            'fecha' => ['nullable', 'date'],
            'nit' => ['nullable', 'string', 'max:80'],
            'empresa' => ['required', 'string', 'max:180'],
            'detalles_soporte' => ['required', 'string', 'max:6000'],
            'telefono' => ['required', 'string', 'max:40'],
            'anydesk' => ['nullable', 'string', 'max:240'],
            'error_image' => ['nullable', 'image', 'max:5120'],
            'error_images' => ['nullable', 'array', 'max:8'],
            'error_images.*' => ['image', 'max:5120'],
            'observacion_tecnico' => ['nullable', 'string', 'max:6000'],
            'estado_soporte' => ['nullable', Rule::in(Support::STATES)],
            'tecnico_asignado_id' => ['nullable', Rule::exists('users', 'id')->where('role', 'tecnico')->where('active', true)],
        ];
    }
}
