<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Registro do que acontece no sistema (quem fez o quê e quando).
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('association_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 60);            // ex.: package.created, auth.login_failed
            $table->string('description');
            $table->string('subject_type', 60)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('ip', 45)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['association_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
