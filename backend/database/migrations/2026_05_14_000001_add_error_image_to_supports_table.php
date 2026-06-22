<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supports', function (Blueprint $table) {
            if (! Schema::hasColumn('supports', 'error_image_path')) {
                $table->string('error_image_path')->nullable()->after('anydesk');
            }
        });
    }

    public function down(): void
    {
        Schema::table('supports', function (Blueprint $table) {
            if (Schema::hasColumn('supports', 'error_image_path')) {
                $table->dropColumn('error_image_path');
            }
        });
    }
};
