<?php
require_once __DIR__ . '/../config/database.php';

class ProductController {
    private ?PDO $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    private function processImageUrl(?string $imageUrl): string {
        if (!$imageUrl) {
            return '/images/artwork_whispers.jpg';
        }

        // If it's a Base64 data URL from phone or desktop upload
        if (preg_match('/^data:image\/(\w+);base64,(.+)$/s', $imageUrl, $matches)) {
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

                $filename = 'art_' . time() . '_' . rand(1000, 9999) . '.' . $ext;

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

        return $imageUrl;
    }

    public function getProducts(?string $type = null): array {
        if (!$this->db) {
            return $this->getMockProducts($type);
        }

        try {
            if ($type && in_array($type, ['original', 'print', 'digital'])) {
                $stmt = $this->db->prepare("SELECT * FROM products WHERE type = :type ORDER BY id DESC");
                $stmt->execute(['type' => $type]);
            } else {
                $stmt = $this->db->prepare("SELECT * FROM products ORDER BY id DESC");
                $stmt->execute();
            }
            $products = $stmt->fetchAll();

            // Cast boolean & numeric types properly for JSON response
            return array_map(function($p) {
                $p['id'] = (int)$p['id'];
                $p['price'] = (float)$p['price'];
                $p['weight'] = (float)$p['weight'];
                $p['stock_quantity'] = (int)$p['stock_quantity'];
                $p['allow_original'] = isset($p['allow_original']) ? (bool)$p['allow_original'] : true;
                $p['allow_print'] = isset($p['allow_print']) ? (bool)$p['allow_print'] : true;
                $p['allow_digital'] = isset($p['allow_digital']) ? (bool)$p['allow_digital'] : true;
                $p['print_price'] = isset($p['print_price']) ? (float)$p['print_price'] : round($p['price'] * 0.25);
                $p['digital_price'] = isset($p['digital_price']) ? (float)$p['digital_price'] : 15.0;
                return $p;
            }, $products);

        } catch (PDOException $e) {
            error_log("getProducts Error: " . $e->getMessage());
            return $this->getMockProducts($type);
        }
    }

    public function getProductById(int $id): ?array {
        if (!$this->db) {
            $all = $this->getMockProducts();
            foreach ($all as $item) {
                if ($item['id'] === $id) return $item;
            }
            return null;
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM products WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $product = $stmt->fetch();
            if ($product) {
                $product['id'] = (int)$product['id'];
                $product['price'] = (float)$product['price'];
                $product['weight'] = (float)$product['weight'];
                $product['stock_quantity'] = (int)$product['stock_quantity'];
                $product['allow_original'] = isset($product['allow_original']) ? (bool)$product['allow_original'] : true;
                $product['allow_print'] = isset($product['allow_print']) ? (bool)$product['allow_print'] : true;
                $product['allow_digital'] = isset($product['allow_digital']) ? (bool)$product['allow_digital'] : true;
                $product['print_price'] = isset($product['print_price']) ? (float)$product['print_price'] : round($product['price'] * 0.25);
                $product['digital_price'] = isset($product['digital_price']) ? (float)$product['digital_price'] : 15.0;
            }
            return $product ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }

    public function createProduct(array $data): int|bool {
        if (!$this->db) {
            return true;
        }

        $processedImageUrl = $this->processImageUrl($data['image_url'] ?? null);

        try {
            $stmt = $this->db->prepare("INSERT INTO products (
                title, description, price, weight, dimensions, type, stock_quantity, 
                image_url, allow_original, allow_print, allow_digital, print_price, digital_price
            ) VALUES (
                :title, :description, :price, :weight, :dimensions, :type, :stock_quantity, 
                :image_url, :allow_original, :allow_print, :allow_digital, :print_price, :digital_price
            )");

            $success = $stmt->execute([
                'title' => $data['title'] ?? 'Untitled Artwork',
                'description' => $data['description'] ?? '',
                'price' => $data['price'] ?? 0,
                'weight' => $data['weight'] ?? 0,
                'dimensions' => $data['dimensions'] ?? '',
                'type' => $data['type'] ?? 'original',
                'stock_quantity' => $data['stock_quantity'] ?? 1,
                'image_url' => $processedImageUrl,
                'allow_original' => isset($data['allow_original']) ? ($data['allow_original'] ? 1 : 0) : 1,
                'allow_print' => isset($data['allow_print']) ? ($data['allow_print'] ? 1 : 0) : 1,
                'allow_digital' => isset($data['allow_digital']) ? ($data['allow_digital'] ? 1 : 0) : 1,
                'print_price' => $data['print_price'] ?? round(($data['price'] ?? 0) * 0.25),
                'digital_price' => $data['digital_price'] ?? 15.00
            ]);

            return $success ? (int)$this->db->lastInsertId() : false;
        } catch (PDOException $e) {
            error_log("createProduct Error: " . $e->getMessage());
            return false;
        }
    }

    public function updateProduct(int $id, array $data): bool {
        if (!$this->db) {
            return true;
        }

        $processedImageUrl = $this->processImageUrl($data['image_url'] ?? null);

        try {
            $stmt = $this->db->prepare("UPDATE products SET 
                title = :title, 
                price = :price, 
                weight = :weight, 
                type = :type, 
                dimensions = :dimensions, 
                description = :description, 
                stock_quantity = :stock_quantity, 
                image_url = :image_url,
                allow_original = :allow_original,
                allow_print = :allow_print,
                allow_digital = :allow_digital,
                print_price = :print_price,
                digital_price = :digital_price
                WHERE id = :id");

            return $stmt->execute([
                'title' => $data['title'] ?? '',
                'price' => isset($data['price']) ? floatval($data['price']) : 0.0,
                'weight' => isset($data['weight']) ? floatval($data['weight']) : 0.0,
                'type' => $data['type'] ?? 'original',
                'dimensions' => $data['dimensions'] ?? '',
                'description' => $data['description'] ?? '',
                'stock_quantity' => isset($data['stock_quantity']) ? intval($data['stock_quantity']) : 1,
                'image_url' => $processedImageUrl,
                'allow_original' => isset($data['allow_original']) ? ($data['allow_original'] ? 1 : 0) : 1,
                'allow_print' => isset($data['allow_print']) ? ($data['allow_print'] ? 1 : 0) : 1,
                'allow_digital' => isset($data['allow_digital']) ? ($data['allow_digital'] ? 1 : 0) : 1,
                'print_price' => isset($data['print_price']) ? floatval($data['print_price']) : round((floatval($data['price'] ?? 0)) * 0.25),
                'digital_price' => isset($data['digital_price']) ? floatval($data['digital_price']) : 15.00,
                'id' => $id
            ]);
        } catch (PDOException $e) {
            error_log("updateProduct Error: " . $e->getMessage());
            return false;
        }
    }

    public function deleteProduct(int $id): bool {
        if (!$this->db) {
            return true;
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM products WHERE id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log("deleteProduct Error: " . $e->getMessage());
            return false;
        }
    }

    private function getMockProducts(?string $filterType = null): array {
        $products = [
            [
                'id' => 1,
                'title' => 'Whispers in Burgundy',
                'description' => 'Original oil painting on linen canvas. Textured impasto technique capturing stillness, shadow, and deep burgundy pigment.',
                'price' => 1850.00,
                'weight' => 3.50,
                'dimensions' => '120cm x 90cm',
                'type' => 'original',
                'stock_quantity' => 1,
                'image_url' => '/images/artwork_whispers.jpg',
                'is_featured' => true,
                'allow_original' => true,
                'allow_print' => true,
                'allow_digital' => true,
                'print_price' => 240.00,
                'digital_price' => 15.00
            ]
        ];

        if ($filterType) {
            return array_values(array_filter($products, fn($p) => $p['type'] === strtolower($filterType)));
        }

        return $products;
    }
}
