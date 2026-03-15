<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlatformSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'maintenance_mode' => ['sometimes', 'boolean'],
            'open_registrations' => ['sometimes', 'boolean'],
            'free_trial' => ['sometimes', 'boolean'],
            'force_2fa' => ['sometimes', 'boolean'],
            'trial_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
        ];
    }
}
