<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $url;


    public function __construct(string $url)
    {
        $this->url = $url;

    }

    public function build()
    {
        return $this->view('emails.email-verification')
                    ->with(['url' => $this->url, ]);
    }
}