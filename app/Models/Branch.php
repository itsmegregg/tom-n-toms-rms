<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $primaryKey = 'branch_id';

    protected $fillable = [
        'branch_name',
        'branch_description',
        'branch_address',
        'concept_id'
    ];

    // Relationship with Concept
    public function concept()
    {
        return $this->belongsTo(Concept::class, 'concept_id', 'concept_id');
    }
}
