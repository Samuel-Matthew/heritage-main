<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'reported_by',
        'reason',
        'description',
        'status',
        'admin_notes',
    ];

    /**
     * Get the store that was reported
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Get the user who submitted the report
     */
    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
