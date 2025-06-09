<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BirDetailed extends Model
{
    use HasFactory;

    protected $table = 'bir_detailed';

    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'si_number',
        'vat_exempt',
        'vat_zero_rate',
        'vatable_amount',
        'vat_12',
        'less_vat',
        'gross_amount',
        'discount_type',
        'discount_amount',
        'service_charge',
        'net_total',
        'cash',
        'other_payment',
        'tx_number'
    ];

    protected $casts = [
        'date' => 'date',
        'vat_exempt' => 'decimal:2',
        'vat_zero_rate' => 'decimal:2',
        'vatable_amount' => 'decimal:2',
        'vat_12' => 'decimal:2',
        'less_vat' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'net_total' => 'decimal:2',
        'cash' => 'decimal:2',
        'other_payment' => 'decimal:2'
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
