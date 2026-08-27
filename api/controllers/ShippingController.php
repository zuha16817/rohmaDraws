<?php
require_once __DIR__ . '/../services/ShippingCalculator.php';

class ShippingController {
    public function calculateShipping(array $input): array {
        $countryCode = strtoupper(trim($input['country_code'] ?? 'SG'));
        $items = $input['items'] ?? [];

        if (empty($items)) {
            return [
                'shipping_cost' => 0.00,
                'total_weight_kg' => 0.00,
                'is_digital_only' => true,
                'message' => 'No items in cart'
            ];
        }

        return ShippingCalculator::calculate($items, $countryCode);
    }

    public function getRates(): array {
        return ShippingCalculator::getRates();
    }

    public function updateRates(array $rates): array {
        $success = ShippingCalculator::saveRates($rates);
        if ($success) {
            return [
                'status' => 'success',
                'message' => 'Shipping rates updated successfully.',
                'rates' => ShippingCalculator::getRates()
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'Failed to save shipping rates.'
            ];
        }
    }
}
