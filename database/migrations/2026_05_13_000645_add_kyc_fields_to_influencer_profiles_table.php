<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('influencer_profiles', function (Blueprint $table) {
            $table->string('cin_front_url')->nullable();
            $table->string('selfie_url')->nullable();
            $table->enum('verification_status', ['pending', 'approved', 'rejected', 'not_submitted'])->default('not_submitted');
            $table->text('verification_note')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('influencer_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'cin_front_url',
                'selfie_url',
                'verification_status',
                'verification_note',
                'verified_at',
                'submitted_at'
            ]);
        });
    }
};
