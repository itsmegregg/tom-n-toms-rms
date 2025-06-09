<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Products extends Model
{
    use HasFactory;

    protected $table = 'products';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'product_code',
        'product_desc',

    ];

    protected $casts = [
        'active' => 'boolean',
    ];
}
