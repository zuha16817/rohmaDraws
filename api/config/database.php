<?php
// PHP PDO MySQL Database Configuration for rohmaadraws.com

class Database {
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;
    private ?PDO $conn = null;

    public function __construct() {
        $localConfigPath = __DIR__ . '/database.local.php';
        if (file_exists($localConfigPath)) {
            $config = require $localConfigPath;
            $this->host = $config['host'] ?? 'localhost';
            $this->db_name = $config['db_name'] ?? 'rohmadraws_db';
            $this->username = $config['username'] ?? 'root';
            $this->password = $config['password'] ?? '';
        } else {
            $this->host = getenv('DB_HOST') ?: 'localhost';
            $this->db_name = getenv('DB_NAME') ?: 'rohmadraws_db';
            $this->username = getenv('DB_USER') ?: 'root';
            $this->password = getenv('DB_PASS') ?: '';
        }
    }

    public function getConnection(): ?PDO {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch(PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
        }
        return $this->conn;
    }
}
