<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->index('slug');
            $table->index('is_active');
        });

        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('deliverables')->nullable();
            $table->json('platforms')->nullable()->comment('e.g. [tiktok, instagram]');
            $table->decimal('budget_min', 12, 2)->nullable();
            $table->decimal('budget_max', 12, 2)->nullable();
            $table->date('deadline')->nullable();
            $table->string('country')->nullable();
            $table->json('target_niches')->nullable();
            $table->integer('min_followers')->nullable();
            $table->decimal('min_engagement_rate', 5, 2)->nullable();
            $table->enum('status', [
                'draft', 'published', 'pending', 'negotiating',
                'agreed', 'active', 'completed', 'cancelled'
            ])->default('draft');
            $table->json('ai_match_criteria')->nullable();
            $table->decimal('ai_match_score', 5, 2)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('status');
            $table->index('client_id');
            $table->index('category_id');
            $table->index('deadline');
            $table->index('budget_min');
            $table->index('budget_max');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('categories');
    }
};
