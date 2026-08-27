<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MailerService.php';

class CommissionController {
    private ?PDO $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getCommissionRequests(): array {
        if (!$this->db) {
            return [];
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM commission_requests ORDER BY id DESC");
            $stmt->execute();
            $requests = $stmt->fetchAll();

            return array_map(function($r) {
                $r['id'] = (int)$r['id'];
                $r['budget'] = is_numeric($r['budget']) ? (float)$r['budget'] : $r['budget'];
                return $r;
            }, $requests);

        } catch (PDOException $e) {
            return [];
        }
    }

    public function handleCommissionRequest(array $input, array $files = []): array {
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $budget = trim($input['budget'] ?? '0');
        $size = trim($input['size'] ?? '');
        $description = trim($input['description'] ?? '');
        $referenceUrl = trim($input['reference_url'] ?? '');
        $referenceImageUrl = null;

        if (empty($name) || empty($email) || empty($description)) {
            return ['status' => 'error', 'message' => 'Please fill in Name, Email, and Project Description.'];
        }

        // Handle uploaded reference image file
        if (!empty($files['reference_image']) && $files['reference_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }

            $fileName = 'comm_' . time() . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '', basename($files['reference_image']['name']));
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($files['reference_image']['tmp_name'], $targetPath)) {
                $referenceImageUrl = '/api/uploads/' . $fileName;
            }
        } elseif (!empty($input['reference_image_url'])) {
            $referenceImageUrl = filter_var($input['reference_image_url'], FILTER_SANITIZE_URL);
        }

        // Insert into MySQL database FIRST — before any email sending
        if ($this->db) {
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO commission_requests (name, email, budget, size, description, reference_url, reference_image_url, status) 
                    VALUES (:name, :email, :budget, :size, :description, :reference_url, :reference_image_url, 'pending')
                ");
                $stmt->execute([
                    ':name'                => $name,
                    ':email'               => $email,
                    ':budget'              => $budget,
                    ':size'                => $size,
                    ':description'         => $description,
                    ':reference_url'       => $referenceUrl,
                    ':reference_image_url' => $referenceImageUrl
                ]);
            } catch (PDOException $e) {
                error_log("Commission DB Insert error: " . $e->getMessage());
                return ['status' => 'error', 'message' => 'Failed to save commission request. Please try again.'];
            }
        }

        // Build the success response payload
        $response = [
            'status'  => 'success',
            'message' => 'Your commission request has been received by Rohma Draws Studio. We will contact you within 48 hours.',
            'request_summary' => [
                'name'                => $name,
                'email'               => $email,
                'budget'              => $budget,
                'size'                => $size,
                'reference_url'       => $referenceUrl,
                'reference_image_url' => $referenceImageUrl
            ]
        ];

        // Dispatch email notification safely
        try {
            $mailer = new MailerService();
            $mailer->sendCommissionAlertToRohma([
                'name'        => $name,
                'email'       => $email,
                'budget'      => $budget,
                'size'        => $size,
                'description' => $description
            ]);
        } catch (Throwable $e) {
            error_log("Commission mailer notice: " . $e->getMessage());
        }

        return $response;
    }

    public function updateCommissionStatus(int $id, string $status): bool {
        if (!$this->db) {
            return false;
        }

        try {
            $stmt = $this->db->prepare("UPDATE commission_requests SET status = :status WHERE id = :id");
            return $stmt->execute([':status' => $status, ':id' => $id]);
        } catch (PDOException $e) {
            return false;
        }
    }

    public function deleteCommissionRequest(int $id): bool {
        if (!$this->db) {
            return false;
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM commission_requests WHERE id = :id");
            return $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            return false;
        }
    }
}
