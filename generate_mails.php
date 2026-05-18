<?php
$mails = [
    'WelcomeMail' => ['name' => '$name'],
    'EmailVerificationMail' => ['url' => '$url'],
    'KYCSubmittedMail' => ['name' => '$name'],
    'KYCApprovedMail' => ['name' => '$name'],
    'KYCRejectedMail' => ['name' => '$name', 'reason' => '$reason'],
    'CollaborationRequestMail' => ['name' => '$name', 'sender' => '$sender', 'campaignTitle' => '$campaignTitle', 'budget' => '$budget'],
    'DealConfirmedMail' => ['name' => '$name', 'partnerName' => '$partnerName', 'campaignTitle' => '$campaignTitle', 'amount' => '$amount'],
    'ReviewReceivedMail' => ['name' => '$name', 'reviewerName' => '$reviewerName', 'rating' => '$rating', 'comment' => '$comment']
];

$dir = __DIR__ . '/app/Mail';
if (!is_dir($dir)) mkdir($dir, 0755, true);

foreach ($mails as $class => $props) {
    $propsDec = '';
    $propsAssign = '';
    $viewData = '';
    foreach ($props as $key => $val) {
        $propsDec .= "    public string $val;\n";
        $propsAssign .= "        \$this->$key = $val;\n";
        $viewData .= "'$key' => \$this->$key, ";
    }

    $args = implode(', string ', $props);
    if ($args) $args = 'string ' . $args;

    $viewName = strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', str_replace('Mail', '', $class)));

    $content = <<<PHP
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class $class extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

$propsDec

    public function __construct($args)
    {
$propsAssign
    }

    public function build()
    {
        return \$this->view('emails.$viewName')
                    ->with([$viewData]);
    }
}
PHP;

    file_put_contents("$dir/$class.php", $content);
}
echo "Mail classes generated.\n";
