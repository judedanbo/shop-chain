<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\AnnouncementPriority;
use ShopChain\Core\Enums\AnnouncementTarget;

class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'target' => ['required', 'string', Rule::enum(AnnouncementTarget::class)],
            'priority' => ['required', 'string', Rule::enum(AnnouncementPriority::class)],
        ];
    }
}
