<?php
// Server-side admin authentication. The admin password now lives only here —
// it is never sent to or checked in the browser.

class AuthService {
    private string $adminPassword;
    private string $tokenSecret;

    public function __construct() {
        $localConfigPath = __DIR__ . '/../config/admin.local.php';
        if (file_exists($localConfigPath)) {
            $config = require $localConfigPath;
            $this->adminPassword = $config['password'] ?? '';
        } else {
            $this->adminPassword = getenv('ADMIN_PASSWORD') ?: '';
        }

        // Signing secret is derived separately from the password so that changing
        // the password immediately invalidates every token issued before the change.
        $this->tokenSecret = hash('sha256', $this->adminPassword . '|rohma-draws-admin-token');
    }

    public function verifyPassword(string $password): bool {
        return $this->adminPassword !== '' && hash_equals($this->adminPassword, $password);
    }

    public function issueToken(int $ttlSeconds = 43200): string {
        $expires = (string)(time() + $ttlSeconds);
        $signature = hash_hmac('sha256', $expires, $this->tokenSecret);
        return base64_encode($expires . '.' . $signature);
    }

    public function verifyToken(?string $token): bool {
        if (!$token) {
            return false;
        }
        $decoded = base64_decode($token, true);
        if ($decoded === false || strpos($decoded, '.') === false) {
            return false;
        }
        [$expires, $signature] = explode('.', $decoded, 2);
        if (!ctype_digit($expires) || (int)$expires < time()) {
            return false;
        }
        $expected = hash_hmac('sha256', $expires, $this->tokenSecret);
        return hash_equals($expected, $signature);
    }

    private static function bearerTokenFromRequest(): ?string {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /**
     * Guard for admin-only routes. Exits with 401 if the request does not carry
     * a valid admin session token.
     */
    public static function requireAdmin(): void {
        $auth = new self();
        if (!$auth->verifyToken(self::bearerTokenFromRequest())) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin login required.']);
            exit();
        }
    }
}
