<?php
// Database Table Auto-Initializer & Migration for Rohma Draws Studio
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Unable to connect to MySQL database.");
    }

    $sql = file_get_contents(__DIR__ . '/schema.sql');
    if (!$sql) {
        throw new Exception("schema.sql file not found.");
    }

    // Execute schema statements
    $db->exec($sql);

    // Alter columns to LONGTEXT to prevent image_url truncation
    @$db->exec("ALTER TABLE products MODIFY image_url LONGTEXT NOT NULL");
    @$db->exec("ALTER TABLE products MODIFY secondary_images LONGTEXT DEFAULT NULL");
    @$db->exec("ALTER TABLE products MODIFY digital_file_url LONGTEXT DEFAULT NULL");

    // Fix commission_requests table: add missing reference_url column if not exists
    @$db->exec("ALTER TABLE commission_requests ADD COLUMN IF NOT EXISTS reference_url VARCHAR(500) DEFAULT NULL");
    // Fix commission_requests status ENUM to include 'pending'
    @$db->exec("ALTER TABLE commission_requests MODIFY status ENUM('pending','new','reviewed','accepted','declined') DEFAULT 'pending'");

    // Clear broken/truncated base64 records if any exist
    @$db->exec("DELETE FROM products WHERE image_url LIKE 'data:image%' AND LENGTH(image_url) < 1000");

    echo json_encode([
        "status" => "success",
        "message" => "Database tables successfully created & migrated to LONGTEXT in rohmnkmq_rohmaadraws!"
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
