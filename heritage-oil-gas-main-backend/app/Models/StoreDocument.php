<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StoreDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'type',
        'file_path',
        'mime_type',
        'file_size',
        'status',
        'is_mandatory',
        'rejection_reason',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}

