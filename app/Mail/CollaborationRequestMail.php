<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CollaborationRequestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $name;
    public string $sender;
    public string $campaignTitle;
    public string $budget;


    public function __construct(string $name, string $sender, string $campaignTitle, string $budget)
    {
        $this->name = $name;
        $this->sender = $sender;
        $this->campaignTitle = $campaignTitle;
        $this->budget = $budget;

    }

    public function build()
    {
        return $this->view('emails.collaboration-request')
                    ->with(['name' => $this->name, 'sender' => $this->sender, 'campaignTitle' => $this->campaignTitle, 'budget' => $this->budget, ]);
    }
}