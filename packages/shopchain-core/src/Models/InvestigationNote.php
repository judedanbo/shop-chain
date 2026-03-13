<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestigationNote extends BaseModel
{
    const UPDATED_AT = null;

    protected $table = 'investigation_notes';

    protected $fillable = [
        'investigation_id',
        'author_id',
        'content',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function investigation(): BelongsTo
    {
        return $this->belongsTo(Investigation::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'author_id');
    }
}
