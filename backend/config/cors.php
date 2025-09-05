<?php
return [
    'paths' => ['api/*', 'auth/*'], // match your routes
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',  // React app
        'http://127.0.0.1:5173',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
     'max_age' => 900,
    'supports_credentials' => true,
];
