<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('influencer_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('platform', ['tiktok', 'instagram', 'youtube', 'twitter', 'facebook']);
            $table->string('username');
            $table->string('profile_url')->nullable();
            $table->bigInteger('followers_count')->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);
            $table->decimal('avg_likes', 10, 2)->default(0);
            $table->decimal('avg_comments', 10, 2)->default(0);
            $table->decimal('avg_views', 10, 2)->nullable();
            $table->json('audience_demographics')->nullable();
            $table->decimal('fake_follower_score', 5, 2)->default(0)->comment('0=clean, 100=likely fake');
            $table->boolean('is_verified')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('platform');
            $table->index('followers_count');
            $table->index('engagement_rate');
            $table->unique(['influencer_profile_id', 'platform', 'username']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
