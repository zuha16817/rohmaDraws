<?php
// Secure Digital Fine Art Download Endpoint
// Requires verified proof of purchase (valid paid order or signed cryptographic token).

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/services/AuthService.php';

$orderNumber = trim($_GET['order'] ?? $_GET['order_number'] ?? '');
$token = trim($_GET['token'] ?? '');
$expires = isset($_GET['expires']) ? (int)$_GET['expires'] : 0;
$rawRequestedFile = $_GET['file'] ?? $_GET['item'] ?? '';
$imageUrl = $_GET['url'] ?? '';
$productId = isset($_GET['id']) ? intval($_GET['id']) : null;

// Strip out '(Digital Copy)', '(Digital Download)', etc. from title
$requestedFile = trim(preg_replace('/\s*\((Digital Copy|Digital Download|Print|Original|Digital)\)/i', '', $rawRequestedFile));

// Signing secret for cryptographic download tokens
$localConfigPath = __DIR__ . '/config/admin.local.php';
$adminConfig = file_exists($localConfigPath) ? require $localConfigPath : [];
$signingSecret = hash('sha256', ($adminConfig['password'] ?? 'rohma-draws-secret') . '|download-tokens');

$isAuthorized = false;

// 1. Check for Admin Authentication Token in headers
$authService = new AuthService();
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
    if ($authService->verifyToken(trim($m[1]))) {
        $isAuthorized = true;
    }
}

// 2. Check for Signed Cryptographic Token (Time-limited download links)
if (!$isAuthorized && !empty($token) && !empty($orderNumber) && $expires > 0) {
    if (time() <= $expires) {
        $expectedToken = hash_hmac('sha256', $orderNumber . '|' . $requestedFile . '|' . $expires, $signingSecret);
        if (hash_equals($expectedToken, $token)) {
            $isAuthorized = true;
        }
    }
}

// 3. Check for Verified Paid Order in MySQL Database
if (!$isAuthorized && !empty($orderNumber)) {
    try {
        $database = new Database();
        $db = $database->getConnection();
        if ($db) {
            $stmt = $db->prepare("SELECT * FROM orders WHERE order_number = :order_number LIMIT 1");
            $stmt->execute([':order_number' => $orderNumber]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($order && (strtolower($order['payment_status'] ?? '') === 'paid' || strtolower($order['status'] ?? '') === 'paid')) {
                // Verify that the requested item was actually part of this order
                $orderItems = is_string($order['items']) ? json_decode($order['items'], true) : ($order['items'] ?? []);
                if (is_array($orderItems)) {
                    // Match by product ID or title
                    foreach ($orderItems as $item) {
                        $itemTitle = trim(preg_replace('/\s*\((Digital Copy|Digital Download|Print|Original|Digital)\)/i', '', $item['title'] ?? ''));
                        $itemId = intval($item['id'] ?? 0);

                        if (($productId && $itemId === $productId) ||
                            (!empty($requestedFile) && strcasecmp($itemTitle, $requestedFile) === 0) ||
                            (!empty($requestedFile) && stripos($itemTitle, $requestedFile) !== false) ||
                            (!empty($rawRequestedFile) && stripos($item['title'] ?? '', $rawRequestedFile) !== false)) {
                            $isAuthorized = true;
                            break;
                        }
                    }
                }
            }
        }
    } catch (Throwable $e) {
        error_log("Order verification error in download.php: " . $e->getMessage());
    }
}

// Block unverified / unpaid requests immediately
if (!$isAuthorized) {
    http_response_code(403);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'status' => 'error',
        'message' => 'Access denied. A valid paid order reference or secure download token is required to access master digital files.'
    ]);
    exit();
}

// Resolve file path safely
$secureDir = realpath(__DIR__ . '/secure_downloads/');
$imagesDir = realpath(__DIR__ . '/../images/');
$apiUploadsDir = realpath(__DIR__ . '/uploads/');
$rootUploadsDir = realpath(__DIR__ . '/../uploads/');

$dirsToCheck = array_values(array_filter([$secureDir, $apiUploadsDir, $rootUploadsDir, $imagesDir]));
$filePath = null;
$downloadName = null;

// 1. Resolve via image URL basename if provided
if (!$filePath && !empty($imageUrl)) {
    $urlBasename = basename(parse_url($imageUrl, PHP_URL_PATH));
    if (!empty($urlBasename)) {
        foreach ($dirsToCheck as $dir) {
            $candidate = $dir . DIRECTORY_SEPARATOR . $urlBasename;
            if (file_exists($candidate)) {
                $filePath = $candidate;
                $downloadName = (!empty($requestedFile) ? $requestedFile : pathinfo($urlBasename, PATHINFO_FILENAME)) . '.' . (pathinfo($urlBasename, PATHINFO_EXTENSION) ?: 'jpg');
                break;
            }
        }
    }
}

// 2. Resolve by exact title or filename
if (!$filePath && !empty($requestedFile)) {
    $cleanName = basename($requestedFile);
    $exts = ['', '.jpg', '.jpeg', '.png', '.pdf', '.webp'];

    foreach ($dirsToCheck as $dir) {
        if (!is_dir($dir)) continue;
        foreach ($exts as $ext) {
            $candidate = $dir . DIRECTORY_SEPARATOR . $cleanName . $ext;
            if (file_exists($candidate)) {
                $filePath = $candidate;
                $downloadName = $cleanName . ($ext ?: '.jpg');
                break 2;
            }
        }
    }
}

// 3. Case-insensitive filename matching
if (!$filePath && !empty($requestedFile)) {
    $reqTitle = strtolower(trim(pathinfo($requestedFile, PATHINFO_FILENAME)));

    foreach ($dirsToCheck as $dir) {
        if (!is_dir($dir)) continue;
        $scan = @scandir($dir);
        if (!$scan) continue;
        foreach ($scan as $f) {
            if ($f === '.' || $f === '..' || $f === '.htaccess') continue;
            $fTitle = strtolower(trim(pathinfo($f, PATHINFO_FILENAME)));
            if ($fTitle === $reqTitle) {
                $filePath = $dir . DIRECTORY_SEPARATOR . $f;
                $downloadName = $f;
                break 2;
            }
        }
    }
}

// 4. Query MySQL products table for the image_url or digital_file_url
if (!$filePath) {
    try {
        $database = new Database();
        $db = $database->getConnection();
        if ($db) {
            $stmt = null;
            if ($productId) {
                $stmt = $db->prepare("SELECT title, image_url, digital_file_url FROM products WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $productId]);
            } elseif (!empty($requestedFile)) {
                $stmt = $db->prepare("SELECT title, image_url, digital_file_url FROM products WHERE title = :title OR title LIKE :title_like LIMIT 1");
                $stmt->execute([':title' => $requestedFile, ':title_like' => '%' . $requestedFile . '%']);
            }

            if ($stmt) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    $targetUrls = array_filter([$row['digital_file_url'] ?? '', $row['image_url'] ?? '']);
                    foreach ($targetUrls as $tUrl) {
                        $dbBasename = basename(parse_url($tUrl, PHP_URL_PATH));
                        if (!empty($dbBasename)) {
                            foreach ($dirsToCheck as $dir) {
                                if (file_exists($dir . DIRECTORY_SEPARATOR . $dbBasename)) {
                                    $filePath = $dir . DIRECTORY_SEPARATOR . $dbBasename;
                                    $downloadName = (!empty($requestedFile) ? $requestedFile : $row['title']) . '.' . (pathinfo($dbBasename, PATHINFO_EXTENSION) ?: 'jpg');
                                    break 2;
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (Throwable $e) {
        error_log("Product lookup error in download.php: " . $e->getMessage());
    }
}

// Ensure file exists and prevent path traversal
if (!$filePath || !file_exists($filePath)) {
    http_response_code(404);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'status' => 'error',
        'message' => 'The requested artwork master file could not be found.'
    ]);
    exit();
}

$realFilePath = realpath($filePath);
$allowed = false;
foreach ($dirsToCheck as $dir) {
    if ($dir && strpos($realFilePath, $dir) === 0) {
        $allowed = true;
        break;
    }
}

if (!$allowed) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Invalid file path.']);
    exit();
}

$fileSize = filesize($realFilePath);
$mimeType = mime_content_type($realFilePath) ?: 'application/octet-stream';
$finalDownloadName = $downloadName ?: basename($realFilePath);

if (ob_get_level()) {
    ob_end_clean();
}

header("Content-Description: File Transfer");
header("Content-Type: {$mimeType}");
header("Content-Disposition: attachment; filename=\"" . addslashes($finalDownloadName) . "\"");
header("Content-Transfer-Encoding: binary");
header("Expires: 0");
header("Cache-Control: private, must-revalidate, post-check=0, pre-check=0");
header("Pragma: public");
header("Content-Length: " . $fileSize);

readfile($realFilePath);
exit();
