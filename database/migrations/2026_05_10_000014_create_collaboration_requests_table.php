<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collaboration_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('influencer_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', [
                'pending', 'negotiating', 'agreed', 'active', 'completed', 'rejected', 'cancelled'
            ])->default('pending');
            $table->decimal('proposed_amount', 12, 2)->nullable();
            $table->decimal('agreed_amount', 12, 2)->nullable();
            $table->text('message')->nullable();
            $table->timestamp('client_confirmed_at')->nullable();
            $table->timestamp('influencer_confirmed_at')->nullable();
            $table->timestamp('agreed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('ai_match_score', 5, 2)->nullable();
            $table->json('ai_match_explanation')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('campaign_id');
            $table->index('client_id');
            $table->index('influencer_id');
            $table->index('status');
        });

        Schema::create('negotiations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collaboration_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['offer', 'counter_offer', 'accepted', 'rejected', 'cancelled']);
            $table->decimal('amount', 12, 2)->nullable();
            $table->text('message')->nullable();
            $table->json('terms')->nullable();
            $table->timestamps();

            $table->index('collaboration_request_id');
            $table->index('sender_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negotiations');
        Schema::dropIfExists('collaboration_requests');
    }
};
