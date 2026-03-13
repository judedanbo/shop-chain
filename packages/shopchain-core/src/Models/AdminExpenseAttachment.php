<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminExpenseAttachment extends BaseModel
{
    public $timestamps = false;

    protected $table = 'admin_expense_attachments';

    protected $fillable = [
        'expense_id',
        'name',
        'type',
        'size',
        'url',
        'added_at',
    ];

    protected function casts(): array
    {
        return [
            'added_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function expense(): BelongsTo
    {
        return $this->belongsTo(AdminExpense::class, 'expense_id');
    }
}
