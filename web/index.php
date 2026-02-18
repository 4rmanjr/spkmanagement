<?php
// Router for PHP built-in server
// Redirect all requests to api/index.php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// If the file exists, serve it directly
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// Otherwise, route to api/index.php
require __DIR__ . '/api/index.php';
