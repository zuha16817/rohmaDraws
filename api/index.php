<?php
// PHP REST API Entry Point & Router for Rohma Draws Studio Portfolio

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/OrderController.php';
require_once __DIR__ . '/controllers/CommissionController.php';
require_once __DIR__ . '/controllers/ShippingController.php';
require_once __DIR__ . '/controllers/PaymentController.php';
require_once __DIR__ . '/controllers/SettingsController.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Standardized payload reading
$rawInput = file_get_contents('php://input');
$input = !empty($rawInput) ? json_decode($rawInput, true) : $_POST;

try {
    if (strpos($uri, '/api/products') !== false) {
        $controller = new ProductController();
        if ($method === 'GET') {
            $type = $_GET['type'] ?? null;
            $id = isset($_GET['id']) ? intval($_GET['id']) : null;
            
            if ($id) {
                $data = $controller->getProductById($id);
                echo json_encode($data ? ['status' => 'success', 'data' => $data] : ['status' => 'error', 'message' => 'Artwork not found']);
            } else {
                $data = $controller->getProducts($type);
                echo json_encode(['status' => 'success', 'data' => $data]);
            }
        } elseif ($method === 'POST') {
            $action = $_GET['action'] ?? ($input['action'] ?? null);
            if ($action === 'update_carousel') {
                $featuredIds = $input['featured_ids'] ?? [];
                if ($controller->updateCarousel($featuredIds)) {
                    echo json_encode(['status' => 'success', 'message' => 'Homepage carousel updated successfully.']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Failed to update homepage carousel.']);
                }
            } elseif ($action === 'update') {
                $id = isset($_GET['id']) ? intval($_GET['id']) : ($input['id'] ?? null);
                if ($id && $controller->updateProduct($id, $input ?? [])) {
                    echo json_encode(['status' => 'success', 'message' => 'Artwork updated in database.']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Failed to update artwork in database.']);
                }
            } else {
                $newId = $controller->createProduct($input ?? []);
                if ($newId) {
                    echo json_encode(['status' => 'success', 'message' => 'Artwork published to database.', 'id' => $newId]);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Failed to publish artwork to database.']);
                }
            }
        } elseif ($method === 'PUT') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : ($input['id'] ?? null);
            if ($id && $controller->updateProduct($id, $input ?? [])) {
                echo json_encode(['status' => 'success', 'message' => 'Artwork updated in database.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update artwork in database.']);
            }
        } elseif ($method === 'DELETE') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : ($input['id'] ?? null);
            if ($id && $controller->deleteProduct($id)) {
                echo json_encode(['status' => 'success', 'message' => 'Artwork removed from database.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to remove artwork from database.']);
            }
        }
    } elseif (strpos($uri, '/api/commissions') !== false) {
        $controller = new CommissionController();
        if ($method === 'GET') {
            $requests = $controller->getCommissionRequests();
            echo json_encode(['status' => 'success', 'data' => $requests]);
        } elseif ($method === 'POST') {
            echo json_encode($controller->handleCommissionRequest($input ?? [], $_FILES ?? []));
        } elseif ($method === 'PUT') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : ($input['id'] ?? null);
            $status = $input['status'] ?? 'reviewed';
            if ($id && $controller->updateCommissionStatus($id, $status)) {
                echo json_encode(['status' => 'success', 'message' => 'Commission inquiry status updated.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update commission status.']);
            }
        } elseif ($method === 'DELETE') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : ($input['id'] ?? null);
            if ($id && $controller->deleteCommissionRequest($id)) {
                echo json_encode(['status' => 'success', 'message' => 'Commission inquiry removed.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to remove commission inquiry.']);
            }
        }
    } elseif (strpos($uri, '/api/settings') !== false) {
        $controller = new SettingsController();
        if ($method === 'GET') {
            echo json_encode(['status' => 'success', 'data' => $controller->getSettings()]);
        } elseif ($method === 'POST' || $method === 'PUT') {
            echo json_encode($controller->updateSettings($input ?? []));
        }
    } elseif (strpos($uri, '/api/shipping/rates') !== false) {
        $controller = new ShippingController();
        if ($method === 'GET') {
            echo json_encode(['status' => 'success', 'data' => $controller->getRates()]);
        } elseif ($method === 'POST' || $method === 'PUT') {
            $rates = $input['rates'] ?? ($input ?? []);
            echo json_encode($controller->updateRates($rates));
        }
    } elseif (strpos($uri, '/api/shipping/calculate') !== false && $method === 'POST') {
        $controller = new ShippingController();
        echo json_encode($controller->calculateShipping($input ?? []));
    } elseif (strpos($uri, '/api/orders') !== false) {
        $controller = new OrderController();
        if ($method === 'GET') {
            $orders = $controller->getOrders();
            echo json_encode(['status' => 'success', 'data' => $orders]);
        } elseif ($method === 'POST') {
            echo json_encode($controller->createOrder($input ?? []));
        } elseif ($method === 'PUT') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : ($input['id'] ?? null);
            $status = $input['status'] ?? 'paid';
            if ($id && $controller->updateOrderStatus($id, $status)) {
                echo json_encode(['status' => 'success', 'message' => 'Order status updated.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update order status.']);
            }
        } elseif ($method === 'DELETE') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : ($input['id'] ?? null);
            if ($id && $controller->deleteOrder($id)) {
                echo json_encode(['status' => 'success', 'message' => 'Order deleted.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete order.']);
            }
        }
    } elseif (strpos($uri, '/api/payments/stripe-intent') !== false && $method === 'POST') {
        $controller = new PaymentController();
        echo json_encode($controller->createStripePaymentIntent($input ?? []));
    } elseif (strpos($uri, '/api/payments/paypal-order') !== false && $method === 'POST') {
        $controller = new PaymentController();
        echo json_encode($controller->createPayPalOrder($input ?? []));
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Endpoint not found', 'path' => $uri]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
