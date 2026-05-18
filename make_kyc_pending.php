<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$profile = \App\Models\InfluencerProfile::where('verification_status', 'not_submitted')->first();
if ($profile) {
    $profile->verification_status = 'pending';
    $profile->submitted_at = now();
    
    // Add some dummy images so you can see them in the UI
    $profile->cin_front_url = 'https://placehold.co/600x400/000000/FFF?text=CIN+Front';
    $profile->selfie_url = 'https://placehold.co/400x400/000000/FFF?text=Selfie';
    
    $profile->save();
    echo 'Updated user ' . $profile->user_id . ' to pending status so it appears in the queue.';
} else {
    echo 'No unsubmitted profiles found to update.';
}
