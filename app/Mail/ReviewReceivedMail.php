<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReviewReceivedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $name;
    public string $reviewerName;
    public string $rating;
    public string $comment;


    public function __construct(string $name, string $reviewerName, string $rating, string $comment)
    {
        $this->name = $name;
        $this->reviewerName = $reviewerName;
        $this->rating = $rating;
        $this->comment = $comment;

    }

    public function build()
    {
        return $this->view('emails.review-received')
                    ->with(['name' => $this->name, 'reviewerName' => $this->reviewerName, 'rating' => $this->rating, 'comment' => $this->comment, ]);
    }
}