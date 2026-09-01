<?php
require_once __DIR__ . '/../services/StripeService.php';

class PaymentController {
    private StripeService $stripeService;

    public function __construct() {
        $this->stripeService = new StripeService();
    }

    public function createStripePaymentIntent(array $input): array {
        $amount = floatval($input['amount'] ?? 0);
        $currency = strtolower(trim($input['currency'] ?? 'sgd'));
        $email = trim($input['email'] ?? '');

        if ($amount <= 0) {
            return ['status' => 'error', 'message' => 'Invalid payment amount.'];
        }

        $intent = $this->stripeService->createPaymentIntent($amount, $currency, $email);
        
        return [
            'status' => 'success',
            'payment_intent' => $intent
        ];
    }

    public function createPayPalOrder(array $input): array {
        $amount = floatval($input['amount'] ?? 0);
        $currency = strtoupper(trim($input['currency'] ?? 'USD'));

        return [
            'status' => 'success',
            'id' => 'PAYPAL-ORDER-' . strtoupper(substr(md5(uniqid()), 0, 10)),
            'intent' => 'CAPTURE',
            'status_details' => 'CREATED',
            'amount' => $amount,
            'currency' => $currency,
            'approval_url' => 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-MOCK-TOKEN'
        ];
    }

    public function createCheckoutSession(array $input): array {
        $items = $input['items'] ?? [];
        $customerEmail = trim($input['customer_email'] ?? ($input['email'] ?? ''));
        $successUrl = $input['success_url'] ?? 'https://rohmadraws.com/?status=success&session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = $input['cancel_url'] ?? 'https://rohmadraws.com/?status=cancel';
        $paymentMethod = $input['payment_method'] ?? 'all';
        $currency = $input['currency'] ?? ($paymentMethod === 'paynow' ? 'sgd' : 'usd');
        $metadata = $input['metadata'] ?? [];

        if (empty($items)) {
            return ['status' => 'error', 'message' => 'No items provided for checkout.'];
        }

        return $this->stripeService->createCheckoutSession(
            $items,
            $customerEmail,
            $successUrl,
            $cancelUrl,
            $paymentMethod,
            $currency,
            $metadata
        );
    }

    public function verifySession(string $sessionId): array {
        $session = $this->stripeService->getCheckoutSession($sessionId);
        if (!$session) {
            return ['status' => 'error', 'message' => 'Session not found.'];
        }

        return [
            'status' => 'success',
            'session' => $session,
            'is_paid' => ($session['payment_status'] ?? '') === 'paid'
        ];
    }
}
