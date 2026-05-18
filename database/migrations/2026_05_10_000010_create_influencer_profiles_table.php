<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('influencer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->text('bio')->nullable();
            $table->string('profile_picture')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->json('languages')->nullable();
            $table->json('niches')->nullable();
            $table->decimal('price_min', 10, 2)->nullable();
            $table->decimal('price_max', 10, 2)->nullable();
            $table->enum('availability', ['available', 'busy', 'unavailable'])->default('available');
            $table->boolean('is_verified')->default(false);
            $table->decimal('trust_score', 5, 2)->default(0);
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->integer('rating_count')->default(0);
            $table->integer('completed_campaigns')->default(0);
            $table->integer('response_time_hours')->nullable();
            $table->json('fake_follower_flags')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('trust_score');
            $table->index('rating_avg');
            $table->index('availability');
            $table->index('is_verified');
            $table->index('country');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('influencer_profiles');
    }
};
