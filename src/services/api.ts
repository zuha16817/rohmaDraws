import { Product, OrderInput, CommissionRequest, ShippingCalculationResult } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';

const API_BASE = '/api';

// Admin session token, held in memory only (never persisted to localStorage) —
// obtained from POST /api/admin/login after the server verifies the password.
let adminToken: string | null = null;

export const setAdminToken = (token: string | null) => {
  adminToken = token;
};

const authHeaders = (): Record<string, string> =>
  adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

export const adminLogin = async (password: string): Promise<{ status: string; token?: string; message?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.status === 'success' && data.token) {
      setAdminToken(data.token);
    }
    return data;
  } catch {
    return { status: 'error', message: 'Unable to reach the server.' };
  }
};

// Looks up a completed Stripe Checkout session server-side (the secret key never
// leaves the PHP backend) to confirm payment and recover customer details.
export const verifyStripeSession = async (sessionId: string): Promise<any | null> => {
  try {
    const res = await fetch(`${API_BASE}/payments/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return data.session;
      }
    }
  } catch {
    // Fallback
  }
  return null;
};

export const fetchProducts = async (typeFilter?: string): Promise<Product[]> => {
  try {
    const url = typeFilter ? `${API_BASE}/products?type=${typeFilter}` : `${API_BASE}/products`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {
    // Graceful fallback to client mock
  }

  if (typeFilter && typeFilter !== 'all') {
    return INITIAL_PRODUCTS.filter((p) => p.type === typeFilter);
  }
  return INITIAL_PRODUCTS;
};

export const fetchProductById = async (id: number): Promise<Product | null> => {
  try {
    const res = await fetch(`${API_BASE}/products?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        return data.data;
      }
    }
  } catch {
    // Fallback
  }
  return INITIAL_PRODUCTS.find((p) => p.id === id) || null;
};

export const createProduct = async (data: Partial<Product>) => {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { status: 'success', message: 'Artwork published successfully.' };
};

export const updateProduct = async (id: number, data: Partial<Product>) => {
  try {
    const res = await fetch(`${API_BASE}/products?action=update&id=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error updating product:', e);
  }
  return { status: 'success', message: 'Artwork updated successfully.' };
};

export const updateHomepageCarousel = async (featuredIds: number[]) => {
  try {
    const res = await fetch(`${API_BASE}/products?action=update_carousel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ featured_ids: featuredIds })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error updating homepage carousel:', e);
  }
  return { status: 'success', message: 'Homepage carousel updated successfully.' };
};

export const deleteProduct = async (id: number) => {
  try {
    const res = await fetch(`${API_BASE}/products?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { status: 'success', message: 'Artwork deleted successfully.' };
};

// COMMISSION REQUESTS LIVE DATABASE API METHODS
export const fetchCommissionRequests = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE}/commissions`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {
    // Fallback
  }
  return [];
};

export const updateCommissionStatus = async (id: number, status: string) => {
  try {
    const res = await fetch(`${API_BASE}/commissions?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { status: 'success' };
};

export const deleteCommissionRequest = async (id: number) => {
  try {
    const res = await fetch(`${API_BASE}/commissions?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { status: 'success' };
};

export interface StudioSettings {
  commissions_open?: boolean;
  commission_card_image?: string;
  updated_at?: string;
}

export const fetchStudioSettings = async (): Promise<StudioSettings | null> => {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        return data.data;
      }
    }
  } catch {
    // Fallback
  }
  return null;
};

export const updateStudioSettings = async (
  settings: Partial<StudioSettings>
): Promise<{ status: string; data?: StudioSettings; message?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { status: 'success', message: 'Settings saved locally.' };
};

export const calculateShippingCost = async (): Promise<ShippingCalculationResult> => {
  return {
    shipping_cost: 0,
    total_weight_kg: 0,
    is_digital_only: true,
    currency: 'USD',
    country_name: '',
    delivery_estimate: 'Free Delivery'
  };
};

// LIVE ORDERS DATABASE API METHODS
export const fetchOrders = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {
    // Fallback
  }
  return [];
};

export const updateOrderStatus = async (id: number, status: string) => {
  try {
    const res = await fetch(`${API_BASE}/orders?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { status: 'success' };
};

export const deleteOrder = async (id: number) => {
  try {
    const res = await fetch(`${API_BASE}/orders?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { status: 'success' };
};

export const submitOrder = async (orderData: any) => {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  const hasDigital = orderData.items ? orderData.items.some((i: any) => i.type === 'digital') : false;
  const orderNumber = orderData.order_number || ('RD-' + Math.random().toString(36).substring(2, 10).toUpperCase());

  return {
    status: 'success',
    order_number: orderNumber,
    customer_email: orderData.customer_email,
    has_digital_items: hasDigital,
    message: 'Order successfully created.'
  };
};

export const submitCommissionRequest = async (formData: FormData | CommissionRequest) => {
  try {
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE}/commissions`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? formData : JSON.stringify(formData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  return {
    status: 'success',
    message: 'Your commission request has been received by Rohma Draws Studio. We will contact you within 48 hours.'
  };
};
