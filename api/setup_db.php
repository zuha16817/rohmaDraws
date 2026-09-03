<?php
// Database Table Auto-Initializer & Migration (CLI / Admin Only)
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/services/AuthService.php';

// Disallow unauthenticated web requests
if (php_sapi_name() !== 'cli') {
    AuthService::requireAdmin();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Unable to connect to database.");
    }

    $sqlFile = __DIR__ . '/schema.sql';
    if (file_exists($sqlFile)) {
        $sql = file_get_contents($sqlFile);
        if ($sql) {
            $db->exec($sql);
        }
    }

    // Alter columns to LONGTEXT to prevent image_url truncation
    @$db->exec("ALTER TABLE products MODIFY image_url LONGTEXT NOT NULL");
    @$db->exec("ALTER TABLE products MODIFY secondary_images LONGTEXT DEFAULT NULL");
    @$db->exec("ALTER TABLE products MODIFY digital_file_url LONGTEXT DEFAULT NULL");
    @$db->exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE");
    @$db->exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS carousel_order INT DEFAULT 0");

    // Fix commission_requests table
    @$db->exec("ALTER TABLE commission_requests ADD COLUMN IF NOT EXISTS reference_url VARCHAR(500) DEFAULT NULL");
    @$db->exec("ALTER TABLE commission_requests MODIFY status ENUM('pending','new','reviewed','accepted','declined') DEFAULT 'pending'");

    echo json_encode([
        "status" => "success",
        "message" => "Database tables and schema migrations up to date."
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database migration failed."
    ], JSON_PRETTY_PRINT);
}
