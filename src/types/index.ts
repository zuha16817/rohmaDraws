export type ProductType = 'original' | 'print' | 'digital';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  weight: number; // in kg (0 for digital)
  dimensions?: string;
  type: ProductType;
  stock_quantity: number;
  image_url: string;
  secondary_images?: string[];
  digital_file_url?: string;
  is_featured?: boolean;
  carousel_order?: number;
  year?: number;
  badge?: 'AVAILABLE' | 'SOLD' | 'LIMITED EDITION' | 'INSTANT DOWNLOAD';
  
  // Format Edition Options (controlled in Admin Dashboard per artwork)
  allow_original?: boolean;
  allow_print?: boolean;
  allow_digital?: boolean;
  print_price?: number;
  digital_price?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderInput {
  customer_name: string;
  customer_email: string;
  shipping_country: string;
  shipping_address: string;
  payment_method: 'stripe_paynow' | 'stripe_card' | 'stripe_hosted' | 'paypal';
  items: Array<{
    id: number;
    title: string;
    price: number;
    quantity: number;
    weight: number;
    type: ProductType;
  }>;
}

export interface CommissionRequest {
  id?: number;
  name: string;
  email: string;
  budget: number;
  size: string;
  description: string;
  reference_image_url?: string | null;
  created_at?: string;
  status?: 'new' | 'reviewed' | 'accepted' | 'declined';
}

export interface ShippingCalculationResult {
  shipping_cost: number;
  total_weight_kg: number;
  is_digital_only: boolean;
  currency: string;
  country_name?: string;
  delivery_estimate?: string;
}

export interface ShippingRate {
  code: string;
  name: string;
  base: number;
  per_kg: number;
  delivery_estimate?: string;
}

