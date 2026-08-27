<?php
// Dynamic Master Digital Download Proxy Endpoint
// Handles any artwork title or image URL dynamically for existing and new uploads.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

$rawRequestedFile = $_GET['file'] ?? $_GET['item'] ?? '';
$imageUrl = $_GET['url'] ?? '';
$productId = isset($_GET['id']) ? intval($_GET['id']) : null;

// Strip out '(Digital Copy)', '(Digital Download)', '(Print)', etc. from title
$requestedFile = trim(preg_replace('/\s*\((Digital Copy|Digital Download|Print|Original|Digital)\)/i', '', $rawRequestedFile));

$secureDir = __DIR__ . '/secure_downloads/';
$publicDir = __DIR__ . '/../images/';
$uploadsDir = __DIR__ . '/../uploads/';
$rootUploadsDir = __DIR__ . '/../../uploads/';
$imagesUploadsDir = __DIR__ . '/../images/uploads/';

$dirsToCheck = [$secureDir, $publicDir, $uploadsDir, $rootUploadsDir, $imagesUploadsDir];

$filePath = null;
$downloadName = null;

// 1. Try resolving via image URL (e.g. /images/Test.jpg or /uploads/art_xxx.jpg)
if (!empty($imageUrl)) {
    $urlPath = parse_url($imageUrl, PHP_URL_PATH);
    $urlBasename = basename($urlPath);
    if (!empty($urlBasename)) {
        foreach ($dirsToCheck as $dir) {
            if (file_exists($dir . $urlBasename)) {
                $filePath = $dir . $urlBasename;
                $downloadName = !empty($requestedFile) ? ($requestedFile . '.' . pathinfo($urlBasename, PATHINFO_EXTENSION)) : $urlBasename;
                break;
            }
        }
    }
}

// 2. Try exact match by requested file name/title
if (!$filePath && !empty($requestedFile)) {
    $cleanName = basename($requestedFile);
    $exts = ['', '.jpg', '.jpeg', '.png', '.pdf', '.webp'];

    foreach ($dirsToCheck as $dir) {
        if (!is_dir($dir)) continue;
        foreach ($exts as $ext) {
            $candidate = $cleanName . $ext;
            if (file_exists($dir . $candidate)) {
                $filePath = $dir . $candidate;
                $downloadName = $candidate;
                break 2;
            }
        }
    }
}

// 3. Case-insensitive filename matching in all directories
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
                $filePath = $dir . $f;
                $downloadName = $f;
                break 2;
            }
        }
    }
}

// 4. Try querying MySQL products table if available
if (!$filePath) {
    try {
        require_once __DIR__ . '/config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        if ($db) {
            $stmt = null;
            if ($productId) {
                $stmt = $db->prepare("SELECT title, image_url, digital_file_url FROM products WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $productId]);
            } elseif (!empty($requestedFile)) {
                $stmt = $db->prepare("SELECT title, image_url, digital_file_url FROM products WHERE title LIKE :title LIMIT 1");
                $stmt->execute([':title' => '%' . $requestedFile . '%']);
            }

            if ($stmt) {
                $row = $stmt->fetch();
                if ($row) {
                    $targetUrl = !empty($row['digital_file_url']) ? $row['digital_file_url'] : ($row['image_url'] ?? '');
                    $dbBasename = basename(parse_url($targetUrl, PHP_URL_PATH));
                    if (!empty($dbBasename)) {
                        foreach ($dirsToCheck as $dir) {
                            if (file_exists($dir . $dbBasename)) {
                                $filePath = $dir . $dbBasename;
                                $downloadName = (!empty($requestedFile) ? $requestedFile : $row['title']) . '.' . pathinfo($dbBasename, PATHINFO_EXTENSION);
                                break;
                            }
                        }
                    }
                }
            }
        }
    } catch (Throwable $e) {
        // Fallback silently
    }
}

// 5. If file is still not found, return a proper 404 page
if (!$filePath || !file_exists($filePath)) {
    http_response_code(404);
    header("Content-Type: text/html");
    echo "<!DOCTYPE html><html><body style='font-family:sans-serif;text-align:center;padding:50px;'><h2>Artwork Master File Not Found</h2><p>The high-resolution master file for <strong>" . htmlspecialchars($rawRequestedFile ?: $requestedFile) . "</strong> has not been uploaded to the server folder yet.</p></body></html>";
    exit();
}

$fileSize = filesize($filePath);
$mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
$finalDownloadName = $downloadName ?: basename($filePath);

// Clear output buffering
if (ob_get_level()) {
    ob_end_clean();
}

header("Content-Description: File Transfer");
header("Content-Type: {$mimeType}");
header("Content-Disposition: attachment; filename=\"" . $finalDownloadName . "\"");
header("Content-Transfer-Encoding: binary");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Pragma: public");
header("Content-Length: " . $fileSize);

readfile($filePath);
exit();
