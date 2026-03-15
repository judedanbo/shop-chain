<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'categories' => ['sometimes', 'array'],
            'categories.*' => ['array'],
            'categories.*.enabled' => ['required_with:categories.*', 'boolean'],
            'categories.*.channels' => ['sometimes', 'array'],
            'categories.*.channels.*' => ['string', 'in:in_app,push,email,sms'],
            'quiet_hours_enabled' => ['sometimes', 'boolean'],
            'quiet_hours_start' => ['sometimes', 'date_format:H:i'],
            'quiet_hours_end' => ['sometimes', 'date_format:H:i'],
        ];
    }
}
