<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    // Explicitly define the table name (optional, Laravel will guess "posts")
    protected $table = 'posts';

    // Auto-incrementing is true by default, but we define it explicitly for clarity
    public $incrementing = true;

    // Primary key is integer
    protected $keyType = 'int';

    // Allow mass assignment for these fields
    protected $fillable = [
        'description',
        'status',
        'imageUrls'
    ];

    protected $casts = [
        'imageUrls' => 'array', // ✅ so Laravel handles JSON <-> array
    ];

    // Default attributes (just to enforce status = draft if not set)
    protected $attributes = [
        'status' => 'draft',
    ];
}
