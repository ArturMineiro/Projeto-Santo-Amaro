<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('association_id')->constrained()->cascadeOnDelete();
            $table->foreignId('resident_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('membership_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('type', 20)->default('package');       // package | letter | document | other
            $table->string('description')->nullable();
            $table->string('carrier', 60)->nullable();            // Correios, Mercado Livre...
            $table->string('tracking_code', 80)->nullable();
            $table->text('notes')->nullable();

            $table->string('status', 20)->default('received');    // received | picked_up
            $table->string('pickup_code', 6);                     // código curto mostrado ao morador

            $table->timestamp('arrived_at')->useCurrent();
            $table->timestamp('notified_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->string('picked_up_by_name')->nullable();
            $table->foreignId('delivered_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['association_id', 'status']);
            $table->index(['resident_id', 'status']);
        });

        Schema::create('package_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 20);        // whatsapp | email
            $table->string('status', 20);         // sent | failed
            $table->string('recipient');
            $table->string('provider', 30)->nullable();
            $table->string('provider_message_id')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_notifications');
        Schema::dropIfExists('packages');
    }
};
