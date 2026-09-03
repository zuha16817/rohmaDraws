<?php
// Production Stripe Webhook Listener & Automated Digital Fine Art Delivery Script
// URL Endpoint: https://rohmaadraws.com/api/payments/webhook.php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MailerService.php';

// Configuration: Read Webhook Secret & Stripe Keys from Server Config or Environment
$localConfigPath = __DIR__ . '/../config/stripe.local.php';
$stripeConfig = file_exists($localConfigPath) ? require $localConfigPath : [];

$webhookSecret = $stripeConfig['webhook_secret'] ?? getenv('STRIPE_WEBHOOK_SECRET') ?: '';
$stripeSecretKey = $stripeConfig['secret_key'] ?? getenv('STRIPE_SECRET_KEY') ?: '';

function appendWebhookLog(string $message) {
    error_log("[STRIPE WEBHOOK] {$message}");
}

$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (empty($payload)) {
    appendWebhookLog("Empty payload received.");
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Empty payload']);
    exit();
}

/**
 * Strict Stripe Signature Verification Function
 * Cryptographically verifies HMAC SHA-256 signature and timestamp tolerance.
 */
function verifyStripeSignature(string $payload, string $sigHeader, string $secret, int $tolerance = 300): bool {
    if (empty($sigHeader) || empty($secret)) {
        return false;
    }

    $timestamp = null;
    $signatures = [];

    $items = explode(',', $sigHeader);
    foreach ($items as $item) {
        $pair = explode('=', trim($item), 2);
        if (count($pair) === 2) {
            if ($pair[0] === 't') {
                $timestamp = (int)$pair[1];
            } elseif ($pair[0] === 'v1') {
                $signatures[] = $pair[1];
            }
        }
    }

    if (!$timestamp || empty($signatures)) {
        return false;
    }

    // Reject requests with expired timestamp (replay attack defense)
    if (abs(time() - $timestamp) > $tolerance) {
        return false;
    }

    // Compute expected HMAC SHA-256 signature
    $signedPayload = $timestamp . '.' . $payload;
    $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

    foreach ($signatures as $sig) {
        if (hash_equals($expectedSignature, $sig)) {
            return true;
        }
    }

    return false;
}

// 1. Enforce Webhook Signature Verification
if (!verifyStripeSignature($payload, $sigHeader, $webhookSecret)) {
    appendWebhookLog("Webhook rejected: Signature verification failed or missing signature.");
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing Stripe Webhook Signature']);
    exit();
}

$event = json_decode($payload, true);

if (!$event || !isset($event['type'])) {
    appendWebhookLog("Invalid JSON Event.");
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON event payload']);
    exit();
}

$eventType = $event['type'];
appendWebhookLog("EVENT RECEIVED: {$eventType}");

// 2. Process Stripe Checkout Session Completed or PaymentIntent Succeeded
if ($eventType === 'checkout.session.completed' || $eventType === 'payment_intent.succeeded') {
    $session = $event['data']['object'];
    
    $customerEmail = $session['customer_details']['email'] ?? $session['receipt_email'] ?? $session['metadata']['customer_email'] ?? 'collector@rohmadraws.com';
    $customerName = $session['customer_details']['name'] ?? $session['metadata']['customer_name'] ?? 'Valued Collector';
    $amountPaid = isset($session['amount_total']) ? ($session['amount_total'] / 100) : (isset($session['amount']) ? ($session['amount'] / 100) : 0);
    $transactionId = $session['id'] ?? $session['payment_intent'] ?? 'tx_' . time();
    $orderNumber = 'RD-STRIPE-' . strtoupper(substr(md5($transactionId), 0, 8));

    appendWebhookLog("Processing Order #{$orderNumber} for {$customerName} ({$customerEmail}) Total: \${$amountPaid}");

    $shippingAddress = json_encode($session['shipping_details'] ?? []);
    $itemsMetadata = $session['metadata']['items'] ?? null;
    
    $itemsList = [];
    if ($itemsMetadata) {
        $decoded = json_decode($itemsMetadata, true);
        if (is_array($decoded)) {
            $itemsList = $decoded;
        }
    }

    // Default digital fallback if metadata items not present
    if (empty($itemsList)) {
        $itemsList = [
            [
                'id' => 99,
                'title' => 'Digital Fine Art Download',
                'type' => 'digital',
                'file_name' => 'Minimalistic Flowers.jpg'
            ]
        ];
    }

    // 3. Record Order Details in MySQL Database
    $database = new Database();
    $db = $database->getConnection();

    if ($db) {
        try {
            $stmt = $db->prepare("
                INSERT INTO orders (order_number, customer_name, customer_email, total_paid, payment_status, payment_provider, transaction_id, items_json, shipping_address_json)
                VALUES (:order_number, :customer_name, :customer_email, :total_paid, 'paid', 'stripe', :transaction_id, :items_json, :shipping_address_json)
                ON DUPLICATE KEY UPDATE payment_status = 'paid'
            ");
            $stmt->execute([
                ':order_number' => $orderNumber,
                ':customer_name' => $customerName,
                ':customer_email' => $customerEmail,
                ':total_paid' => $amountPaid,
                ':transaction_id' => $transactionId,
                ':items_json' => json_encode($itemsList),
                ':shipping_address_json' => $shippingAddress
            ]);
            appendWebhookLog("MySQL Order #{$orderNumber} successfully saved.");
        } catch (PDOException $e) {
            appendWebhookLog("MySQL Order Error: " . $e->getMessage());
        }
    }

    // 4. Secure File Access & Automated Email Delivery
    $dirsToCheck = [
        __DIR__ . '/../secure_downloads/',
        __DIR__ . '/../../images/',
        __DIR__ . '/../images/',
        __DIR__ . '/../../uploads/',
        __DIR__ . '/../uploads/',
        __DIR__ . '/../../images/uploads/'
    ];

    $digitalDeliveryItems = [];

    foreach ($itemsList as $item) {
        $rawTitle = $item['title'] ?? 'Digital Fine Art';
        $type = strtolower($item['type'] ?? '');
        $isDigital = ($type === 'digital' || stripos($rawTitle, 'digital') !== false);

        // Only attach files for digital acquisitions
        if (!$isDigital) {
            continue;
        }

        // Clean off suffixes like '(Digital Copy)', '(Digital Download)'
        $cleanTitle = trim(preg_replace('/\s*\((Digital Copy|Digital Download|Print|Original|Digital)\)/i', '', $rawTitle));
        $matchedFile = null;

        // 1. Try finding by item image_url or file_name if provided
        $givenUrl = $item['image_url'] ?? ($item['file_name'] ?? '');
        if (!empty($givenUrl)) {
            $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? dirname(dirname(__DIR__));
            $directPath = $docRoot . '/' . ltrim(parse_url($givenUrl, PHP_URL_PATH), '/');
            if (file_exists($directPath)) {
                $matchedFile = $directPath;
            } else {
                $basename = basename(parse_url($givenUrl, PHP_URL_PATH));
                if (!empty($basename)) {
                    foreach ($dirsToCheck as $dir) {
                        if (file_exists($dir . $basename)) {
                            $matchedFile = $dir . $basename;
                            break;
                        }
                    }
                }
            }
        }

        // 2. Try exact name match with standard image extensions
        if (!$matchedFile && !empty($cleanTitle)) {
            $exts = ['', '.jpg', '.jpeg', '.png', '.pdf', '.webp'];
            foreach ($dirsToCheck as $dir) {
                if (!is_dir($dir)) continue;
                foreach ($exts as $ext) {
                    if (file_exists($dir . $cleanTitle . $ext)) {
                        $matchedFile = $dir . $cleanTitle . $ext;
                        break 2;
                    }
                }
            }
        }

        // 3. Case-insensitive filename matching in all directories
        if (!$matchedFile && !empty($cleanTitle)) {
            $target = strtolower($cleanTitle);
            foreach ($dirsToCheck as $dir) {
                if (!is_dir($dir)) continue;
                $files = @scandir($dir);
                if (!$files) continue;
                foreach ($files as $f) {
                    if ($f === '.' || $f === '..' || $f === '.htaccess') continue;
                    if (strtolower(pathinfo($f, PATHINFO_FILENAME)) === $target) {
                        $matchedFile = $dir . $f;
                        break 2;
                    }
                }
            }
        }

        // 4. Query MySQL products table by ID or Title to get exact image_url
        if (!$matchedFile && $db) {
            try {
                $stmt = null;
                if (!empty($item['id'])) {
                    $stmt = $db->prepare("SELECT title, image_url, digital_file_url FROM products WHERE id = :id LIMIT 1");
                    $stmt->execute([':id' => $item['id']]);
                } elseif (!empty($cleanTitle)) {
                    $stmt = $db->prepare("SELECT title, image_url, digital_file_url FROM products WHERE title LIKE :title LIMIT 1");
                    $stmt->execute([':title' => '%' . $cleanTitle . '%']);
                }

                if ($stmt) {
                    $prodRow = $stmt->fetch();
                    if ($prodRow) {
                        $targetUrl = !empty($prodRow['digital_file_url']) ? $prodRow['digital_file_url'] : ($prodRow['image_url'] ?? '');
                        $dbBasename = basename(parse_url($targetUrl, PHP_URL_PATH));
                        if (!empty($dbBasename)) {
                            foreach ($dirsToCheck as $dir) {
                                if (file_exists($dir . $dbBasename)) {
                                    $matchedFile = $dir . $dbBasename;
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch (Throwable $e) {
                appendWebhookLog("DB product lookup error: " . $e->getMessage());
            }
        }

        if ($matchedFile && file_exists($matchedFile)) {
            $digitalDeliveryItems[] = [
                'title' => $rawTitle,
                'file_path' => $matchedFile
            ];
        }
    }

    // 5. Send Automated Customer Delivery Email via MailerService
    $mailer = new MailerService();
    $emailSuccess = $mailer->sendDigitalDeliveryWithAttachment(
        $customerEmail,
        $customerName,
        $orderNumber,
        $digitalDeliveryItems
    );

    appendWebhookLog("Email Dispatch Result to {$customerEmail}: " . ($emailSuccess ? 'SUCCESS' : 'FAILED'));

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'event' => $eventType,
        'order_number' => $orderNumber,
        'customer_email' => $customerEmail,
        'email_sent' => $emailSuccess
    ]);
    exit();
}

http_response_code(200);
echo json_encode(['status' => 'success', 'event' => $eventType, 'message' => 'Event received']);
