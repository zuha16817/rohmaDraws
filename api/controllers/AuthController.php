<?php
require_once __DIR__ . '/../services/AuthService.php';

class AuthController {
    private AuthService $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    public function login(array $input): array {
        $password = (string)($input['password'] ?? '');
        if ($password === '' || !$this->authService->verifyPassword($password)) {
            return ['status' => 'error', 'message' => 'Incorrect password.'];
        }
        return ['status' => 'success', 'token' => $this->authService->issueToken()];
    }
}
