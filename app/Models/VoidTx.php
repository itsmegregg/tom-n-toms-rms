<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoidTx extends Model
{
    use HasFactory;

    protected $table = 'void_tx';

    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'time',
        'tx_number',
        'terminal',
        'salesinvoice_number',
        'cashier_name',
        'amount',
        'approved_by',
        'remarks'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function concept()
    {
        return $this->belongsTo(Concept::class);
    }
}
