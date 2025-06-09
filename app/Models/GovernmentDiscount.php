<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GovernmentDiscount extends Model
{
    protected $table = 'government_discounts';

    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'terminal',
        'id_no',
        'id_type',
        'name',
        'ref_number',
        'ber',
        'gross_amount',
        'discount_amount'
    ];

    protected $casts = [
        'date' => 'date',
        'gross_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function concept(): BelongsTo
    {
        return $this->belongsTo(Concept::class);
    }
}
