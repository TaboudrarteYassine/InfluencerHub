<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DealConfirmedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $name;
    public string $partnerName;
    public string $campaignTitle;
    public string $amount;


    public function __construct(string $name, string $partnerName, string $campaignTitle, string $amount)
    {
        $this->name = $name;
        $this->partnerName = $partnerName;
        $this->campaignTitle = $campaignTitle;
        $this->amount = $amount;

    }

    public function build()
    {
        return $this->view('emails.deal-confirmed')
                    ->with(['name' => $this->name, 'partnerName' => $this->partnerName, 'campaignTitle' => $this->campaignTitle, 'amount' => $this->amount, ]);
    }
}