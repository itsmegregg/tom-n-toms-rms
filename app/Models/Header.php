<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Header extends Model
{
    use HasFactory;

    protected $table = 'header';
    protected $primaryKey = 'header_id';

    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'reg',
        'or_from',
        'or_to',
        'beg_balance',
        'end_balance',
        'no_transaction',
        'no_guest',
        'reg_guest',
        'ftime_guest',
        'no_void',
        'no_disc',
        'other_disc',
        'senior_disc',
        'pwd_disc',
        'open_disc',
        'vip_disc',
        'employee_disc',
        'promo_disc',
        'free_disc',
        'no_cancel',
        'room_charge',
        'z_count'
    ];

    protected $casts = [
        'date' => 'date',
        'beg_balance' => 'decimal:2',
        'end_balance' => 'decimal:2',
        'no_transaction' => 'integer',
        'no_guest' => 'integer',
        'reg_guest' => 'integer',
        'ftime_guest' => 'integer',
        'no_void' => 'integer',
        'no_disc' => 'integer',
        'other_disc' => 'decimal:2',
        'senior_disc' => 'decimal:2',
        'pwd_disc' => 'decimal:2',
        'open_disc' => 'decimal:2',
        'vip_disc' => 'decimal:2',
        'employee_disc' => 'decimal:2',
        'promo_disc' => 'decimal:2',
        'free_disc' => 'decimal:2',
        'no_cancel' => 'integer',
        'room_charge' => 'decimal:2'
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
