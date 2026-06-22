<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supports', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_soporte')->unique();
            $table->date('fecha');
            $table->string('nit')->nullable();
            $table->string('empresa');
            $table->text('detalles_soporte');
            $table->string('telefono');
            $table->string('anydesk')->nullable();
            $table->time('hora_registro')->nullable();
            $table->time('hora_inicio')->nullable();
            $table->time('hora_final')->nullable();
            $table->text('observacion_tecnico')->nullable();
            $table->enum('estado_soporte', ['pendiente', 'asignado', 'en_proceso', 'finalizado', 'cancelado'])->default('pendiente');
            $table->foreignId('tecnico_asignado_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['fecha', 'estado_soporte']);
            $table->index(['nit', 'telefono']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supports');
    }
};
