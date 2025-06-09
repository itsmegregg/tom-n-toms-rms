<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BirSummary extends Model
{
    protected $table = 'bir_summary';
    
    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'si_first',
        'si_last',
        'beg_amount',
        'end_amount',
        'net_amount',
        'sc',
        'pwd',
        'others',
        'returns',
        'voids',
        'gross_amount',
        'vatable',
        'vat_amount',
        'vat_exempt',
        'zero_rated',
        'less_vat',
        'ewt',
        'service_charge',
        'z_counter'
    ];

    protected $casts = [
        'date' => 'date',
        'beg_amount' => 'decimal:2',
        'end_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'sc' => 'decimal:2',
        'pwd' => 'decimal:2',
        'others' => 'decimal:2',
        'returns' => 'decimal:2',
        'voids' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'vatable' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'vat_exempt' => 'decimal:2',
        'zero_rated' => 'decimal:2',
        'less_vat' => 'decimal:2',
        'ewt' => 'decimal:2',
        'service_charge' => 'decimal:2'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function concept()
    {
        return $this->belongsTo(Concept::class, 'concept_id', 'concept_id');
    }
}
