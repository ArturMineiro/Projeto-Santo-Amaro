<?php

namespace App\Mail;

use App\Models\Package;
use App\Services\PackageMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PackageArrivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Package $package)
    {
        $this->package->loadMissing(['resident', 'association']);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: PackageMessage::subject($this->package) . ' chegou na ' . $this->package->association->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.package-arrived',
            text: 'mail.package-arrived-text',
            with: [
                'package' => $this->package,
                'firstName' => $this->package->resident->firstName(),
                'subjectLine' => PackageMessage::subject($this->package),
            ],
        );
    }
}
