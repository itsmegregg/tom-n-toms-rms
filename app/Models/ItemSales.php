<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemSales extends Model
{
    use HasFactory;

    protected $table = 'item_sales';
    protected $primaryKey = 'item_sales_id';

    protected $fillable = [
        'branch_id',
        'concept_id',
        'date',
        'reg',
        'category_code',
        'sub_item_code',
        'product_code',
        'description',
        'quantity',
        'total_gross',
        'net_sales',
        'charges',
        'vatable_sales',
        'vat_exempt_sales',
        'zero_rated',
        'senior_disc',
        'pwd_disc',
        'other_disc',
        'open_disc',
        'employee_disc',
        'vip_disc',
        'promo',
        'free',
        'voided',
        'combo_meal',
        'combo_qty',
        'service_charge',
        'other_charges',
        'total_cost',
        'combo_main_code',
        'sub_item_code1',
        'transaction_time',
        'receipt_no',
        'cashier_name'
    ];

    protected $casts = [
        'date' => 'date',
        'quantity' => 'decimal:2',
        'total_gross' => 'decimal:2',
        'net_sales' => 'decimal:2',
        'charges' => 'decimal:2',
        'vatable_sales' => 'decimal:2',
        'vat_exempt_sales' => 'decimal:2',
        'zero_rated' => 'decimal:2',
        'senior_disc' => 'decimal:2',
        'pwd_disc' => 'decimal:2',
        'other_disc' => 'decimal:2',
        'open_disc' => 'decimal:2',
        'employee_disc' => 'decimal:2',
        'vip_disc' => 'decimal:2',
        'promo' => 'decimal:2',
        'free' => 'decimal:2',
        'voided' => 'decimal:2',
        'combo_meal' => 'decimal:2',
        'combo_qty' => 'integer',
        'service_charge' => 'decimal:2',
        'other_charges' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'transaction_time' => 'datetime:H:i:s'
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
