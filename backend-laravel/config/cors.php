<?php

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    // Endereço(s) do front, separados por vírgula. Ex.: https://encomendas.minhaassociacao.org
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('FRONTEND_URL', 'http://localhost:5173,http://127.0.0.1:5173')))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 3600,

    // Autenticação é por token Bearer, não por cookie
    'supports_credentials' => false,
];
