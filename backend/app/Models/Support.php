<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Support extends Model
{
    use HasFactory;

    public const STATES = ['pendiente', 'asignado', 'en_proceso', 'finalizado', 'cancelado'];

    public const EDITABLE_FIELDS = [
        'nit',
        'empresa',
        'detalles_soporte',
        'telefono',
        'anydesk',
        'observacion_tecnico',
        'estado_soporte',
        'tecnico_asignado_id',
    ];

    protected $fillable = [
        'codigo_soporte',
        'fecha',
        'nit',
        'empresa',
        'detalles_soporte',
        'telefono',
        'anydesk',
        'error_image_path',
        'error_image_paths',
        'hora_registro',
        'hora_inicio',
        'hora_final',
        'observacion_tecnico',
        'estado_soporte',
        'tecnico_asignado_id',
    ];

    protected $casts = [
        'fecha' => 'date:Y-m-d',
        'error_image_paths' => 'array',
    ];

    protected $appends = ['tecnico_asignado_nombre', 'contact_name', 'contact_phone', 'error_image_url', 'error_image_urls'];

    protected static function booted(): void
    {
        static::deleting(function (Support $support) {
            Storage::disk('public')->delete($support->storedErrorImagePaths());
        });
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'tecnico_asignado_id');
    }

    public function messages()
    {
        return $this->hasMany(SupportMessage::class);
    }

    public function logs()
    {
        return $this->hasMany(SupportLog::class);
    }

    public function getTecnicoAsignadoNombreAttribute(): ?string
    {
        return $this->technician?->name;
    }

    public function getContactNameAttribute(): ?string
    {
        return $this->technician?->name ?: CompanySetting::current()->company_name;
    }

    public function getContactPhoneAttribute(): ?string
    {
        return $this->technician?->phone ?: CompanySetting::current()->support_phone;
    }

    public function getErrorImageUrlAttribute(): ?string
    {
        return $this->error_image_path ? Storage::disk('public')->url($this->error_image_path) : null;
    }

    public function getErrorImageUrlsAttribute(): array
    {
        return collect($this->storedErrorImagePaths())
            ->filter()
            ->map(fn ($path) => Storage::disk('public')->url($path))
            ->values()
            ->all();
    }

    public function storedErrorImagePaths(): array
    {
        $paths = $this->error_image_paths ?: [];

        if ($this->error_image_path && ! in_array($this->error_image_path, $paths, true)) {
            array_unshift($paths, $this->error_image_path);
        }

        return collect($paths)
            ->filter(fn ($path) => is_string($path) && $path !== '')
            ->unique()
            ->values()
            ->all();
    }

    public function publicPayload(): array
    {
        $this->loadMissing('technician');
        $settings = CompanySetting::current();

        $payload = $this->only([
            'id',
            'codigo_soporte',
            'fecha',
            'nit',
            'empresa',
            'detalles_soporte',
            'telefono',
            'anydesk',
            'error_image_path',
            'error_image_paths',
            'hora_registro',
            'hora_inicio',
            'hora_final',
            'estado_soporte',
            'created_at',
            'updated_at',
        ]);
        $payload['tecnico_asignado_nombre'] = $this->tecnico_asignado_nombre;
        $payload['error_image_url'] = $this->error_image_url;
        $payload['error_image_urls'] = $this->error_image_urls;
        $payload['contact_phone'] = $this->contact_phone;
        $payload['contact_name'] = $this->contact_name;
        $payload['company_settings'] = [
            'company_name' => $settings->company_name,
            'support_phone' => $settings->support_phone,
            'support_email' => $settings->support_email,
            'business_hours' => $settings->business_hours,
            'default_whatsapp_message' => $settings->default_whatsapp_message,
        ];

        return $payload;
    }
}
