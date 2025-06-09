<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentDetails extends Model
{
    protected $table = 'payment_details';
    protected $primaryKey = 'payment_id';
    public $timestamps = true;
    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'reg',
        'description',
        'amount',
        'pay_type',
        'transaction_time',
        'receipt_no',
        'cashier_name'
    ];


    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
        'transaction_time' => 'datetime'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function concept()
    {
        return $this->belongsTo(Concept::class, 'concept_id');
    }
}
