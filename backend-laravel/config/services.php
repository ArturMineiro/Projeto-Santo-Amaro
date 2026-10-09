<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    | WhatsApp: none | log | zapi | ultramsg | twilio
    | "none" desliga o envio automático (o painel ainda oferece o link wa.me).
    | "log" grava a mensagem em storage/logs — bom para desenvolvimento.
    */
    'whatsapp' => [
        'driver' => env('WHATSAPP_DRIVER', 'log'),

        'zapi' => [
            'instance' => env('ZAPI_INSTANCE'),
            'token' => env('ZAPI_TOKEN'),
            'client_token' => env('ZAPI_CLIENT_TOKEN'),
        ],

        'ultramsg' => [
            'instance' => env('ULTRAMSG_INSTANCE'),
            'token' => env('ULTRAMSG_TOKEN'),
        ],

        'twilio' => [
            'sid' => env('TWILIO_SID'),
            'token' => env('TWILIO_TOKEN'),
            'from' => env('TWILIO_WHATSAPP_FROM'),
        ],
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
