<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicStoreSupportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nit' => ['nullable', 'string', 'max:80'],
            'empresa' => ['required', 'string', 'max:180'],
            'detalles_soporte' => ['required', 'string', 'max:6000'],
            'telefono' => ['required', 'string', 'max:40'],
            'anydesk' => ['nullable', 'string', 'max:240'],
            'error_image' => ['nullable', 'image', 'max:5120'],
            'error_images' => ['nullable', 'array', 'max:8'],
            'error_images.*' => ['image', 'max:5120'],
            'sender_name' => ['nullable', 'string', 'max:120'],
        ];
    }
}
