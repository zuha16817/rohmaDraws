const LIVE_STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || '';

interface CheckoutOptions {
  items: Array<{ id?: number; title: string; price: number; quantity: number; image_url?: string; type?: string }>;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
  shippingCountry?: string;
  shippingCost?: number;
  orderNumber?: string;
}

export const redirectToStripeHostedCheckout = async (options: CheckoutOptions) => {
  const {
    items,
    customerName = '',
    customerEmail = '',
    shippingAddress = '',
    shippingCountry = 'SG',
    shippingCost = 0,
    orderNumber = ''
  } = options;

  try {
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${window.location.origin}/?status=success&session_id={CHECKOUT_SESSION_ID}&order_ref=${encodeURIComponent(orderNumber)}`);
    params.append('cancel_url', `${window.location.origin}/?status=cancel`);
    
    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }

    // Save full pending checkout order details locally for instant verification upon return
    localStorage.setItem('pending_stripe_order', JSON.stringify({
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
      shipping_country: shippingCountry,
      shipping_cost: shippingCost,
      items: items
    }));
    localStorage.setItem('pending_stripe_items', JSON.stringify(items));

    // Dynamic file mapping
    const itemsManifest = items.map(i => ({
      id: i.id,
      title: i.title,
      price: i.price,
      quantity: i.quantity,
      type: i.type || 'original',
      image_url: i.image_url || '',
      file_name: `${i.title}.jpg`
    }));
    params.append('metadata[order_number]', orderNumber);
    params.append('metadata[customer_name]', customerName);
    params.append('metadata[items]', JSON.stringify(itemsManifest));

    let lineIndex = 0;
    items.forEach((item) => {
      const unitAmountInCents = Math.max(100, Math.round(item.price * 100));
      params.append(`line_items[${lineIndex}][price_data][currency]`, 'usd');
      params.append(`line_items[${lineIndex}][price_data][product_data][name]`, item.title);
      params.append(`line_items[${lineIndex}][price_data][product_data][description]`, `Rohma Draws Studio (${item.type === 'original' ? 'Original Artwork' : item.type === 'digital' ? 'Digital Download' : 'Archival Print'})`);
      params.append(`line_items[${lineIndex}][price_data][unit_amount]`, unitAmountInCents.toString());
      params.append(`line_items[${lineIndex}][quantity]`, (item.quantity || 1).toString());
      lineIndex++;
    });

    // Create authentic Checkout Session directly with Stripe API
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIVE_STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const session = await response.json();

    if (session.url) {
      // Redirect to authentic active Stripe Hosted Checkout Page
      window.location.href = session.url;
      return;
    } else if (session.error) {
      console.error('Stripe Session Error:', session.error);
      alert(`Stripe Error: ${session.error.message}`);
    }
  } catch (err) {
    console.error('Failed to create Stripe Hosted Checkout session:', err);
    alert('Unable to connect to Stripe. Please verify your network connection.');
  }
};
