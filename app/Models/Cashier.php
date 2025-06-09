<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cashier extends Model
{
    use HasFactory;

    protected $table = 'cashier';
    protected $primaryKey = 'cashier_id';

    protected $fillable = [
        'branch_id',
        'concept_id',
        'cashier',
        'gross_sales',
        'net_sales',
        'cash',
        'card',
        'less_vat',
        'discount',
        'delivery_charge',
        'service_charge',
        'void_amount',
        'void_count',
        'tx_count',
        'date'
    ];

    protected $casts = [
        'date' => 'date',
        'gross_sales' => 'decimal:2',
        'net_sales' => 'decimal:2',
        'cash' => 'decimal:2',
        'card' => 'decimal:2',
        'less_vat' => 'decimal:2',
        'discount' => 'decimal:2',
        'delivery_charge' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'void_amount' => 'decimal:2',
        'void_count' => 'integer',
        'tx_count' => 'integer'
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
