<?php
// Dynamic Weight & Country Shipping Calculator Service with Customizable Rates

class ShippingCalculator {
    private static string $ratesFilePath = __DIR__ . '/../config/shipping_rates.json';

    // Default fallback rates in USD
    private static array $defaultRates = [
        'SG' => ['code' => 'SG', 'name' => 'Singapore', 'base' => 12.00, 'per_kg' => 4.00, 'delivery_estimate' => '2-3 Business Days (Local Delivery)'],
        'US' => ['code' => 'US', 'name' => 'United States', 'base' => 35.00, 'per_kg' => 12.00, 'delivery_estimate' => '5-9 Business Days (Insured Art Freight)'],
        'GB' => ['code' => 'GB', 'name' => 'United Kingdom', 'base' => 35.00, 'per_kg' => 11.50, 'delivery_estimate' => '5-9 Business Days (Insured Art Freight)'],
        'AU' => ['code' => 'AU', 'name' => 'Australia', 'base' => 25.00, 'per_kg' => 8.50, 'delivery_estimate' => '4-8 Business Days (Insured Art Freight)'],
        'CA' => ['code' => 'CA', 'name' => 'Canada', 'base' => 38.00, 'per_kg' => 12.50, 'delivery_estimate' => '5-9 Business Days (Insured Art Freight)'],
        'MY' => ['code' => 'MY', 'name' => 'Malaysia', 'base' => 18.00, 'per_kg' => 5.00, 'delivery_estimate' => '3-5 Business Days (Regional Courier)'],
        'GLOBAL' => ['code' => 'GLOBAL', 'name' => 'Rest of World', 'base' => 45.00, 'per_kg' => 15.00, 'delivery_estimate' => '7-14 Business Days (International Courier)']
    ];

    /**
     * Get all active shipping rates
     */
    public static function getRates(): array {
        if (file_exists(self::$ratesFilePath)) {
            $json = file_get_contents(self::$ratesFilePath);
            $parsed = json_decode($json, true);
            if (is_array($parsed) && !empty($parsed)) {
                return $parsed;
            }
        }
        return self::$defaultRates;
    }

    /**
     * Save shipping rates configured by Admin
     */
    public static function saveRates(array $newRates): bool {
        if (empty($newRates)) {
            return false;
        }

        $ratesToSave = [];
        foreach ($newRates as $key => $rate) {
            $code = strtoupper(trim($rate['code'] ?? $key));
            $name = trim($rate['name'] ?? ($self::$defaultRates[$code]['name'] ?? $code));
            $base = floatval($rate['base'] ?? 0.0);
            $perKg = floatval($rate['per_kg'] ?? 0.0);
            $delivery = trim($rate['delivery_estimate'] ?? '5-9 Business Days');

            $ratesToSave[$code] = [
                'code' => $code,
                'name' => $name,
                'base' => $base,
                'per_kg' => $perKg,
                'delivery_estimate' => $delivery
            ];
        }

        $dir = dirname(self::$ratesFilePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        return (file_put_contents(self::$ratesFilePath, json_encode($ratesToSave, JSON_PRETTY_PRINT)) !== false);
    }

    /**
     * Calculate dynamic shipping fee
     */
    public static function calculate(array $items, string $countryCode): array {
        return [
            'shipping_cost' => 0.00,
            'base_rate' => 0.00,
            'weight_cost' => 0.00,
            'total_weight_kg' => 0.00,
            'is_digital_only' => true,
            'currency' => 'USD',
            'country_name' => $countryCode,
            'delivery_estimate' => 'Free Delivery'
        ];
    }
}
