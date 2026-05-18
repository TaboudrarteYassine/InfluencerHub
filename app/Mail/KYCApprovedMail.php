<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class KYCApprovedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $name;


    public function __construct(string $name)
    {
        $this->name = $name;

    }

    public function build()
    {
        return $this->view('emails.k-y-c-approved')
                    ->with(['name' => $this->name, ]);
    }
}