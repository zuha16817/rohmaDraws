<?php

class StripeService {
    private string $secretKey;
    private string $publishableKey;

    public function __construct() {
        $this->secretKey = getenv('STRIPE_SECRET_KEY') ?: 'sk_test_placeholder';
        $this->publishableKey = getenv('STRIPE_PUBLISHABLE_KEY') ?: 'pk_test_placeholder';
    }

    public function getPublishableKey(): string {
        return $this->publishableKey;
    }

    /**
     * Create live Stripe PaymentIntent for Card / PayNow / Apple Pay
     */
    public function createPaymentIntent(float $amount, string $currency = 'usd', string $customerEmail = '', array $metadata = []): array {
        $amountInCents = (int) round($amount * 100);
        $currency = strtolower($currency);

        $postData = [
            'amount' => $amountInCents,
            'currency' => $currency,
            'automatic_payment_methods[enabled]' => 'true',
            'receipt_email' => $customerEmail
        ];

        foreach ($metadata as $key => $val) {
            $postData["metadata[{$key}]"] = is_array($val) ? json_encode($val) : $val;
        }

        $ch = curl_init('https://api.stripe.com/v1/payment_intents');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_USERPWD, $this->secretKey . ':');
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);

        if ($httpCode === 200 && isset($result['client_secret'])) {
            return [
                'status' => 'success',
                'payment_intent_id' => $result['id'],
                'client_secret' => $result['client_secret'],
                'amount' => $result['amount'],
                'currency' => $result['currency']
            ];
        }

        error_log("Stripe PaymentIntent Error (HTTP {$httpCode}): " . json_encode($result));
        return [
            'status' => 'error',
            'message' => $result['error']['message'] ?? 'Failed to initialize Stripe PaymentIntent',
            'raw' => $result
        ];
    }

    /**
     * Create live Stripe Checkout Session for Hosted Checkout
     */
    public function createCheckoutSession(array $lineItems, string $customerEmail, string $successUrl, string $cancelUrl): array {
        $postData = [
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'customer_email' => $customerEmail
        ];

        $idx = 0;
        foreach ($lineItems as $item) {
            $postData["line_items[{$idx}][price_data][currency]"] = strtolower($item['currency'] ?? 'usd');
            $postData["line_items[{$idx}][price_data][product_data][name]"] = $item['name'] ?? 'Rohma Draws Fine Art';
            $postData["line_items[{$idx}][price_data][unit_amount]"] = (int) round(($item['amount'] ?? 10) * 100);
            $postData["line_items[{$idx}][quantity]"] = $item['quantity'] ?? 1;
            $idx++;
        }

        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_USERPWD, $this->secretKey . ':');
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);

        if ($httpCode === 200 && isset($result['url'])) {
            return [
                'status' => 'success',
                'session_id' => $result['id'],
                'url' => $result['url']
            ];
        }

        return [
            'status' => 'error',
            'message' => $result['error']['message'] ?? 'Failed to create Checkout Session'
        ];
    }
}
