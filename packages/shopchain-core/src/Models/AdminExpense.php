<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\ExpenseCategory;

class AdminExpense extends BaseModel
{
    protected $table = 'admin_expenses';

    protected $fillable = [
        'date',
        'category',
        'description',
        'amount',
        'vendor',
        'recurring',
        'reference',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'category' => ExpenseCategory::class,
            'amount' => 'decimal:2',
            'recurring' => 'boolean',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AdminExpenseAttachment::class, 'expense_id');
    }
}
