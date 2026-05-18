<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class KYCRejectedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $name;
    public string $reason;


    public function __construct(string $name, string $reason)
    {
        $this->name = $name;
        $this->reason = $reason;

    }

    public function build()
    {
        return $this->view('emails.k-y-c-rejected')
                    ->with(['name' => $this->name, 'reason' => $this->reason, ]);
    }
}