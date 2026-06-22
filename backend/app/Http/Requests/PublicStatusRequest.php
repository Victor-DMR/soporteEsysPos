<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_soporte' => ['required_without:codigo', 'string', 'max:40'],
            'codigo' => ['required_without:codigo_soporte', 'string', 'max:40'],
        ];
    }
}
