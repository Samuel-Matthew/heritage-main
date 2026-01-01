<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $table = 'site_settings';
    
    protected $fillable = [
        'site_name',
        'site_title',
        'meta_description',
        'meta_keywords',
        'logo',
        'favicon',
    ];
}
