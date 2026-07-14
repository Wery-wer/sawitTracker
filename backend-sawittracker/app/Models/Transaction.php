<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'farmer_id',
        'date',
        'bruto_weight',
        'tarra_weight',
        'netto_weight',
        'price_per_kg',
        'total_gross_price',
        'debt_deduction',
        'total_net_price',
    ];

    protected $casts = [
        'date' => 'date',
        'bruto_weight' => 'integer',
        'tarra_weight' => 'integer',
        'netto_weight' => 'integer',
        'price_per_kg' => 'decimal:2',
        'total_gross_price' => 'decimal:2',
        'debt_deduction' => 'decimal:2',
        'total_net_price' => 'decimal:2',
    ];

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(Farmer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
