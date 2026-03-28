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
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('description');
            $table->string('tracking_code')->nullable();
            $table->enum('status', ['pending', 'notified', 'picked_up'])->default('pending');
            $table->timestamp('arrival_date')->useCurrent();
            $table->timestamp('notification_sent_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};