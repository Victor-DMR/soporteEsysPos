<?php

namespace App\Http\Requests;

use App\Models\Support;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupportCellRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->active === true;
    }

    public function rules(): array
    {
        return [
            'field' => ['required', Rule::in(Support::EDITABLE_FIELDS)],
            'value' => ['nullable'],
        ];
    }
}
