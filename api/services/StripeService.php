<?php

class StripeService {
    private string $secretKey;
    private string $publishableKey;

    public function __construct() {
        $localConfigPath = __DIR__ . '/../config/stripe.local.php';
        if (file_exists($localConfigPath)) {
            $config = require $localConfigPath;
            $this->secretKey = $config['secret_key'] ?? '';
            $this->publishableKey = $config['publishable_key'] ?? '';
        } else {
            $this->secretKey = getenv('STRIPE_SECRET_KEY') ?: '';
            $this->publishableKey = getenv('STRIPE_PUBLISHABLE_KEY') ?: '';
        }
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
     * Create live Stripe Checkout Session with support for PayNow and Cards
     */
    public function createCheckoutSession(
        array $lineItems,
        string $customerEmail,
        string $successUrl,
        string $cancelUrl,
        string $preferredMethod = 'all',
        string $currency = 'sgd',
        array $metadata = []
    ): array {
        $currency = strtolower($currency);
        $postData = [
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ];

        if (!empty($customerEmail)) {
            $postData['customer_email'] = $customerEmail;
        }

        // Set payment methods based on customer choice
        if ($preferredMethod === 'paynow') {
            $postData['payment_method_types[0]'] = 'paynow';
            $currency = 'sgd'; // PayNow is strictly SGD
        } elseif ($preferredMethod === 'card') {
            $postData['payment_method_types[0]'] = 'card';
        } else {
            // All available methods for Singapore Stripe
            $postData['payment_method_types[0]'] = 'card';
            $postData['payment_method_types[1]'] = 'paynow';
        }

        // Add line items
        $idx = 0;
        foreach ($lineItems as $item) {
            $itemCurrency = !empty($item['currency']) ? strtolower($item['currency']) : $currency;
            $unitAmount = (float)($item['amount'] ?? $item['price'] ?? 10);
            $amountInCents = (int) round($unitAmount * 100);

            $postData["line_items[{$idx}][price_data][currency]"] = $itemCurrency;
            $postData["line_items[{$idx}][price_data][product_data][name]"] = $item['name'] ?? $item['title'] ?? 'Rohma Draws Fine Art';
            $postData["line_items[{$idx}][price_data][unit_amount]"] = max(100, $amountInCents);
            $postData["line_items[{$idx}][quantity]"] = (int)($item['quantity'] ?? 1);
            $idx++;
        }

        // Add metadata
        foreach ($metadata as $key => $val) {
            $postData["metadata[{$key}]"] = is_array($val) ? json_encode($val) : (string)$val;
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
                'url' => $result['url'],
                'payment_method_types' => $result['payment_method_types'] ?? []
            ];
        }

        error_log("Stripe Checkout Session Error (HTTP {$httpCode}): " . json_encode($result));
        return [
            'status' => 'error',
            'message' => $result['error']['message'] ?? 'Failed to create Checkout Session',
            'raw' => $result
        ];
    }

    /**
     * Retrieve live Stripe Checkout Session details
     */
    public function getCheckoutSession(string $sessionId): ?array {
        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions/' . urlencode($sessionId));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $this->secretKey . ':');
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            return json_decode($response, true);
        }
        return null;
    }
}

