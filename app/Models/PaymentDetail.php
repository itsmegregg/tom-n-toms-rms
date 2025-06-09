<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentDetail extends Model
{
    protected $table = 'payment_details';
    protected $primaryKey = 'payment_id';

    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'reg',
        'pay_type',
        'description',
        'amount',
        'transaction_time',
        'receipt_no',
        'cashier_name'
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
