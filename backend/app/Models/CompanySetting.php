<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    private static ?self $current = null;

    protected $fillable = [
        'company_name',
        'support_phone',
        'support_email',
        'default_whatsapp_message',
        'business_hours',
    ];

    public static function current(): self
    {
        return static::$current ??= static::firstOrCreate(
            ['id' => 1],
            [
                'company_name' => 'Soporte ESYS POS',
                'support_phone' => null,
                'default_whatsapp_message' => 'Hola, somos soporte tecnico. Te escribimos sobre tu solicitud #{codigo_soporte} de la empresa {empresa}.',
            ]
        );
    }

    public static function forgetCurrent(): void
    {
        static::$current = null;
    }
}
