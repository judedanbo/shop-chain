<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\AnnouncementPriority;
use ShopChain\Core\Enums\AnnouncementTarget;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'body' => ['sometimes', 'string'],
            'target' => ['sometimes', 'string', Rule::enum(AnnouncementTarget::class)],
            'priority' => ['sometimes', 'string', Rule::enum(AnnouncementPriority::class)],
        ];
    }
}
