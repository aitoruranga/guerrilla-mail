<?php
// Proxy for Guerrilla Mail API to bypass CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Cookie');

$api_url = 'https://api.guerrillamail.com/ajax.php';
$function = $_GET['f'] ?? $_POST['f'] ?? '';

if (!$function) {
    echo json_encode(['error' => 'No function specified']);
    exit;
}

// Prepare parameters
$params = $_REQUEST;
$params['ip'] = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$params['agent'] = $_SERVER['HTTP_USER_AGENT'] ?? 'GuerrillaMail_Proxy';

// Handle Cookies (PHPSESSID, SUBSCR)
$cookie_string = '';
if (isset($_COOKIE['PHPSESSID'])) {
    $cookie_string .= 'PHPSESSID=' . $_COOKIE['PHPSESSID'] . '; ';
}
if (isset($_COOKIE['SUBSCR'])) {
    $cookie_string .= 'SUBSCR=' . $_COOKIE['SUBSCR'] . '; ';
}

// Initialize cURL
$ch = curl_init();

// Prepare POST data
$postdata = http_build_query($params);

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $api_url . '?f=' . $function); // Some params might be better in query string for logging, but POST implies body
// Actually, Guerrilla Mail API often takes 'f' in query and others in body, or all in body. 
// Let's stick to full POST for data, but 'f' is already in $params so it's fine.

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Headers
$headers = [
    "Content-Type: application/x-www-form-urlencoded",
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
];
if ($cookie_string) {
    curl_setopt($ch, CURLOPT_COOKIE, $cookie_string);
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// SSL Verification (Disable for localhost/dev if needed, but try to keep generic)
// For XAMPP on Windows, SSL often fails due to missing CA bundle. 
// We will disable it for now to ensure connectivity, as this is a dev proxy.
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Save headers to forward Set-Cookie
$response_headers = [];
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($curl, $header) use (&$response_headers) {
    $len = strlen($header);
    $header = explode(':', $header, 2);
    if (count($header) < 2) // ignore invalid headers
        return $len;

    $name = strtolower(trim($header[0]));
    if (!array_key_exists($name, $response_headers))
        $response_headers[$name] = [trim($header[1])];
    else
        $response_headers[$name][] = trim($header[1]);

    return $len;
});

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
} else {
    // Forward Set-Cookie headers
    if (isset($response_headers['set-cookie'])) {
        foreach ($response_headers['set-cookie'] as $cookie) {
            header('Set-Cookie: ' . $cookie, false);
        }
    }
    echo $response;
}

curl_close($ch);
?>