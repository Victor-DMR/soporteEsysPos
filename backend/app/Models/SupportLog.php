<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'support_id',
        'user_id',
        'action',
        'old_value',
        'new_value',
        'field_name',
    ];

    public function support()
    {
        return $this->belongsTo(Support::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
