<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supports', function (Blueprint $table) {
            $table->index(['estado_soporte', 'fecha'], 'supports_state_date_index');
            $table->index(['tecnico_asignado_id', 'estado_soporte', 'fecha'], 'supports_technician_state_date_index');
            $table->index('empresa', 'supports_empresa_index');
            $table->index('telefono', 'supports_telefono_index');
            $table->index('updated_at', 'supports_updated_at_index');
        });

        Schema::table('support_messages', function (Blueprint $table) {
            $table->index(['support_id', 'created_at'], 'support_messages_support_created_index');
            $table->index(['support_id', 'sender_type', 'read_at'], 'support_messages_unread_index');
        });

        Schema::table('support_logs', function (Blueprint $table) {
            $table->index(['support_id', 'created_at'], 'support_logs_support_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('support_logs', function (Blueprint $table) {
            $table->dropIndex('support_logs_support_created_index');
        });

        Schema::table('support_messages', function (Blueprint $table) {
            $table->dropIndex('support_messages_support_created_index');
            $table->dropIndex('support_messages_unread_index');
        });

        Schema::table('supports', function (Blueprint $table) {
            $table->dropIndex('supports_state_date_index');
            $table->dropIndex('supports_technician_state_date_index');
            $table->dropIndex('supports_empresa_index');
            $table->dropIndex('supports_telefono_index');
            $table->dropIndex('supports_updated_at_index');
        });
    }
};
