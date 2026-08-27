<?php
// Global Studio Settings Controller for Rohma Draws Studio
// Synchronizes commissions status, showcase picture, shipping rates across ALL devices

require_once __DIR__ . '/../config/database.php';

class SettingsController {
    private string $settingsFile = __DIR__ . '/../config/studio_settings.json';
    private ?PDO $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->ensureSettingsTable();
    }

    private function ensureSettingsTable(): void {
        if (!$this->db) return;
        try {
            $this->db->exec("CREATE TABLE IF NOT EXISTS studio_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value LONGTEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB");
        } catch (\Throwable $e) {
            // Ignore if table creation fails
        }
    }

    private function getDefaultSettings(): array {
        return [
            'commissions_open' => true,
            'commission_card_image' => '/images/Pink Lillies.jpg',
            'updated_at' => date('Y-m-d H:i:s')
        ];
    }

    public function getSettings(): array {
        $settings = $this->getDefaultSettings();

        // 1. Try reading from Database
        if ($this->db) {
            try {
                $stmt = $this->db->query("SELECT setting_key, setting_value FROM studio_settings");
                $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
                if (!empty($rows)) {
                    if (isset($rows['commissions_open'])) {
                        $settings['commissions_open'] = ($rows['commissions_open'] === '1' || $rows['commissions_open'] === 'true');
                    }
                    if (isset($rows['commission_card_image']) && !empty($rows['commission_card_image'])) {
                        $settings['commission_card_image'] = $rows['commission_card_image'];
                    }
                    return $settings;
                }
            } catch (\Throwable $e) {
                // Fallback to JSON file
            }
        }

        // 2. Fallback to JSON config file
        if (file_exists($this->settingsFile)) {
            $json = file_get_contents($this->settingsFile);
            $parsed = json_decode($json, true);
            if (is_array($parsed)) {
                return array_merge($settings, $parsed);
            }
        }

        return $settings;
    }

    public function updateSettings(array $input): array {
        $current = $this->getSettings();

        // Handle Commissions Open
        if (isset($input['commissions_open'])) {
            $current['commissions_open'] = (bool)$input['commissions_open'];
        }

        // Handle Commission Card Image (process base64 if needed)
        if (isset($input['commission_card_image']) && !empty($input['commission_card_image'])) {
            $img = $input['commission_card_image'];
            if (strpos($img, 'data:image/') === 0) {
                $img = $this->saveBase64Image($img);
            }
            $current['commission_card_image'] = $img;
        }

        $current['updated_at'] = date('Y-m-d H:i:s');

        // 1. Save to JSON file
        $dir = dirname($this->settingsFile);
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        @file_put_contents($this->settingsFile, json_encode($current, JSON_PRETTY_PRINT));

        // 2. Save to MySQL Database
        if ($this->db) {
            try {
                $stmt = $this->db->prepare("INSERT INTO studio_settings (setting_key, setting_value) 
                    VALUES (:key, :val) 
                    ON DUPLICATE KEY UPDATE setting_value = :val2");

                $stmt->execute([
                    'key' => 'commissions_open',
                    'val' => $current['commissions_open'] ? '1' : '0',
                    'val2' => $current['commissions_open'] ? '1' : '0'
                ]);

                $stmt->execute([
                    'key' => 'commission_card_image',
                    'val' => $current['commission_card_image'],
                    'val2' => $current['commission_card_image']
                ]);

                $stmt->execute([
                    'key' => 'shipping_rates',
                    'val' => json_encode($current['shipping_rates']),
                    'val2' => json_encode($current['shipping_rates'])
                ]);
            } catch (\Throwable $e) {
                error_log("Settings DB save error: " . $e->getMessage());
            }
        }

        return [
            'status' => 'success',
            'message' => 'Studio settings updated and synchronized across all devices.',
            'data' => $current
        ];
    }

    private function saveBase64Image(string $base64): string {
        if (preg_match('/^data:image\/(\w+);base64,(.+)$/s', $base64, $matches)) {
            $ext = strtolower($matches[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            if (!in_array($ext, ['jpg', 'png', 'webp', 'gif'])) {
                $ext = 'jpg';
            }

            $decoded = base64_decode($matches[2]);
            if ($decoded !== false && strlen($decoded) > 0) {
                $dirs = [
                    __DIR__ . '/../../uploads/',
                    __DIR__ . '/../../images/uploads/',
                    __DIR__ . '/../uploads/'
                ];

                $filename = 'showcase_' . time() . '_' . rand(1000, 9999) . '.' . $ext;

                foreach ($dirs as $dir) {
                    if (!is_dir($dir)) {
                        @mkdir($dir, 0777, true);
                    }
                    $filepath = $dir . $filename;
                    if (@file_put_contents($filepath, $decoded) !== false) {
                        if (strpos($dir, 'images/uploads') !== false) {
                            return '/images/uploads/' . $filename;
                        } elseif (strpos($dir, 'api/uploads') !== false) {
                            return '/api/uploads/' . $filename;
                        } else {
                            return '/uploads/' . $filename;
                        }
                    }
                }
            }
        }
        return $base64;
    }
}
