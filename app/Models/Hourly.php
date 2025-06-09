<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hourly extends Model
{
    use HasFactory;

    protected $table = 'hourly';
    protected $primaryKey = 'hourly_id';
    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'hour',
        'total_trans',
        'total_void',
        'total_sales',
        'total_discount',
        'reg'
    ];

    protected $casts = [
        'date' => 'date',
        'hour' => 'integer',
        'total_trans' => 'integer',
        'total_void' => 'integer',
        'total_sales' => 'decimal:5',
        'total_discount' => 'decimal:5'
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
