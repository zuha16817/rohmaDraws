interface CheckoutOptions {
  items: Array<{ id?: number; title: string; price: number; quantity: number; image_url?: string; type?: string }>;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
  shippingCountry?: string;
  shippingCost?: number;
  orderNumber?: string;
  paymentMethod?: 'paynow' | 'card' | 'all';
}

export const redirectToStripeHostedCheckout = async (options: CheckoutOptions) => {
  const {
    items,
    customerName = '',
    customerEmail = '',
    shippingAddress = '',
    shippingCountry = 'SG',
    shippingCost = 0,
    orderNumber = '',
    paymentMethod = 'all'
  } = options;

  try {
    // Save full pending checkout order details locally for instant verification upon return
    localStorage.setItem('pending_stripe_order', JSON.stringify({
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
      shipping_country: shippingCountry,
      shipping_cost: shippingCost,
      payment_method: paymentMethod,
      items: items
    }));
    localStorage.setItem('pending_stripe_items', JSON.stringify(items));

    const lineItems = items.map((item) => ({
      name: item.title,
      amount: item.price,
      quantity: item.quantity || 1,
      currency: paymentMethod === 'paynow' ? 'sgd' : 'usd'
    }));

    if (shippingCost > 0) {
      lineItems.push({
        name: 'Insured Art Freight & Delivery',
        amount: shippingCost,
        quantity: 1,
        currency: paymentMethod === 'paynow' ? 'sgd' : 'usd'
      });
    }

    const payload = {
      items: lineItems,
      customer_email: customerEmail,
      payment_method: paymentMethod,
      currency: paymentMethod === 'paynow' ? 'sgd' : 'usd',
      success_url: `${window.location.origin}/?status=success&session_id={CHECKOUT_SESSION_ID}&order_ref=${encodeURIComponent(orderNumber)}`,
      cancel_url: `${window.location.origin}/?status=cancel`,
      metadata: {
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail
      }
    };

    const response = await fetch('/api/payments/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.status === 'success' && data.url) {
      window.location.href = data.url;
      return;
    } else {
      console.error('Stripe Session Error:', data);
      alert(`Stripe Error: ${data.message || 'Could not initiate checkout'}`);
    }
  } catch (err) {
    console.error('Failed to create Stripe Hosted Checkout session:', err);
    alert('Unable to connect to Stripe. Please verify your network connection.');
  }
};
