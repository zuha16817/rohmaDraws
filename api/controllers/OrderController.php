<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/ShippingCalculator.php';
require_once __DIR__ . '/../services/MailerService.php';

class OrderController {
    private ?PDO $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getOrders(): array {
        if (!$this->db) {
            return [];
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM orders ORDER BY id DESC");
            $stmt->execute();
            $orders = $stmt->fetchAll();

            return array_map(function($o) {
                $o['id'] = (int)$o['id'];
                $o['total_amount'] = (float)$o['total_amount'];
                $o['shipping_cost'] = (float)($o['shipping_cost'] ?? 0);
                if (is_string($o['items'])) {
                    $decoded = json_decode($o['items'], true);
                    $o['items'] = $decoded !== null ? $decoded : [];
                }
                return $o;
            }, $orders);
        } catch (PDOException $e) {
            error_log("Order fetch error: " . $e->getMessage());
            return [];
        }
    }

    public function createOrder(array $input): array {
        $customerName = trim($input['customer_name'] ?? '');
        $customerEmail = trim($input['customer_email'] ?? '');
        $shippingCountry = trim($input['shipping_country'] ?? 'SG');
        $shippingAddress = trim($input['shipping_address'] ?? 'Standard Delivery');
        $paymentMethod = trim($input['payment_method'] ?? 'stripe_hosted');
        $paymentStatus = trim($input['payment_status'] ?? 'paid');
        $status = trim($input['status'] ?? 'paid');
        $items = $input['items'] ?? [];
        $totalAmountInput = isset($input['total_amount']) ? floatval($input['total_amount']) : null;
        $shippingCostInput = isset($input['shipping_cost']) ? floatval($input['shipping_cost']) : null;
        $orderNumberInput = trim($input['order_number'] ?? '');

        if (empty($customerName) || empty($customerEmail) || empty($items)) {
            return ['status' => 'error', 'message' => 'Missing required customer or items parameters.'];
        }

        // Subtotal calculation
        $subtotal = 0.0;
        $digitalItems = [];

        foreach ($items as $item) {
            $price = floatval($item['price'] ?? 0);
            $qty = intval($item['quantity'] ?? 1);
            $subtotal += ($price * $qty);

            if (($item['type'] ?? '') === 'digital') {
                $digitalItems[] = $item;
            }
        }

        $shippingCost = 0.0;
        $totalAmount = $totalAmountInput !== null ? $totalAmountInput : $subtotal;
        $orderNumber = !empty($orderNumberInput) ? $orderNumberInput : ('RD-' . strtoupper(substr(md5(uniqid()), 0, 8)));

        // Save order in MySQL database
        if ($this->db) {
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO orders 
                    (order_number, customer_name, customer_email, total_amount, shipping_cost, shipping_country, shipping_address, payment_method, payment_status, status, items) 
                    VALUES (:order_number, :customer_name, :customer_email, :total_amount, :shipping_cost, :shipping_country, :shipping_address, :payment_method, :payment_status, :status, :items)
                ");

                $stmt->execute([
                    ':order_number' => $orderNumber,
                    ':customer_name' => $customerName,
                    ':customer_email' => $customerEmail,
                    ':total_amount' => $totalAmount,
                    ':shipping_cost' => $shippingCost,
                    ':shipping_country' => $shippingCountry,
                    ':shipping_address' => $shippingAddress,
                    ':payment_method' => $paymentMethod,
                    ':payment_status' => $paymentStatus,
                    ':status' => $status,
                    ':items' => json_encode($items)
                ]);

                // Only reduce stock for original artworks if payment is confirmed as paid!
                if ($paymentStatus === 'paid' || $status === 'paid') {
                    foreach ($items as $item) {
                        if (($item['type'] ?? '') === 'original' && isset($item['id'])) {
                            $updateStmt = $this->db->prepare("UPDATE products SET stock_quantity = 0 WHERE id = :id AND type = 'original'");
                            $updateStmt->execute([':id' => $item['id']]);
                        }
                    }
                }
            } catch (PDOException $e) {
                error_log("Order DB Insert error: " . $e->getMessage());
            }
        }

        return [
            'status' => 'success',
            'order_number' => $orderNumber,
            'total_amount' => $totalAmount,
            'shipping_cost' => $shippingCost,
            'subtotal' => $subtotal,
            'customer_email' => $customerEmail,
            'has_digital_items' => !empty($digitalItems),
            'message' => 'Order successfully recorded.'
        ];
    }

    public function updateOrderStatus(int $id, string $status): bool {
        if (!$this->db) {
            return false;
        }

        try {
            $stmt = $this->db->prepare("UPDATE orders SET status = :status WHERE id = :id");
            return $stmt->execute([':status' => $status, ':id' => $id]);
        } catch (PDOException $e) {
            error_log("Order status update error: " . $e->getMessage());
            return false;
        }
    }

    public function deleteOrder(int $id): bool {
        if (!$this->db) {
            return false;
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM orders WHERE id = :id");
            return $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            error_log("Order delete error: " . $e->getMessage());
            return false;
        }
    }
}
