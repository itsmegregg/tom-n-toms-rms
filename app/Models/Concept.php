<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Concept extends Model
{
    use HasFactory;

    protected $primaryKey = 'concept_id';

    protected $fillable = [
        'concept_name',
        'concept_description'
    ];

    // Relationship with Branches
    public function branches()
    {
        return $this->hasMany(Branch::class, 'concept_id', 'concept_id');
    }
}
