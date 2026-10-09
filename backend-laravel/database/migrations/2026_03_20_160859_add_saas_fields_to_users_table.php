<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Telefone (WhatsApp) é o identificador principal do morador.
            // Guardado só com dígitos e DDI: 5511999998888
            $table->string('phone', 20)->unique()->after('email');
            $table->boolean('is_super_admin')->default(false)->after('password');
            $table->boolean('is_active')->default(true)->after('is_super_admin');
            $table->boolean('notify_whatsapp')->default(true)->after('is_active');
            $table->boolean('notify_email')->default(true)->after('notify_whatsapp');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone']);
            $table->dropColumn(['phone', 'is_super_admin', 'is_active', 'notify_whatsapp', 'notify_email']);
        });
    }
};
