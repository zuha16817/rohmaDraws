import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, ExternalLink, ShieldCheck, Sparkles, MapPin, User, Mail, Phone, Globe } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { submitOrder } from '../services/api';
import { PayNowModal } from '../components/PayNowModal';
import { redirectToStripeHostedCheckout } from '../services/stripeCheckout';

interface CheckoutProps {
  onBackToShop: () => void;
  onSuccessOrder: (orderSummary: any) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onBackToShop, onSuccessOrder }) => {
  const { cart, subtotal, isDigitalOnly, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'stripe_hosted' | 'stripe_paynow'>('stripe_hosted');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>('');

  // Mandatory Customer & Shipping Details State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('SG');
  const [shippingCost, setShippingCost] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const totalCost = subtotal;

  // USD → SGD conversion for PayNow (Singapore buyers pay in SGD)
  const USD_TO_SGD = 1.35;
  const totalSgd = parseFloat((totalCost * USD_TO_SGD).toFixed(2));

  const validateDetails = (): boolean => {
    setFormError(null);
    if (!customerName.trim()) {
      setFormError('Please enter your Full Name.');
      return false;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('Please enter a valid Email Address for order confirmation & receipt.');
      return false;
    }
    if (!isDigitalOnly) {
      if (!streetAddress.trim()) {
        setFormError('Please enter your Delivery Street Address for insured art freight.');
        return false;
      }
      if (!city.trim()) {
        setFormError('Please enter your City.');
        return false;
      }
      if (!postalCode.trim()) {
        setFormError('Please enter your Postal / Zip Code.');
        return false;
      }
    }
    return true;
  };

  const getFullAddressString = () => {
    if (isDigitalOnly) return 'Digital Delivery (No Physical Address Required)';
    return `${streetAddress.trim()}, ${city.trim()}${stateProvince ? ', ' + stateProvince.trim() : ''}, ${postalCode.trim()}, ${shippingCountry}`;
  };

  const handleDirectStripeCheckout = async () => {
    if (!validateDetails()) return;
    setIsSubmitting(true);

    const orderNumber = 'RD-' + strtoupper(Math.random().toString(36).substring(2, 10));
    setActiveOrderNumber(orderNumber);

    const itemsPayload = cart.map((i) => ({
      id: i.product.id,
      title: i.product.title,
      price: i.product.price,
      quantity: i.quantity,
      type: i.product.type,
      image_url: i.product.image_url || ''
    }));

    // Save pending checkout session data locally for immediate confirmation on return
    try {
      localStorage.setItem('rd_pending_checkout', JSON.stringify({
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        shipping_country: shippingCountry,
        shipping_address: getFullAddressString(),
        total_amount: totalCost,
        shipping_cost: shippingCost,
        items: itemsPayload
      }));
    } catch {}

    // Redirect to Stripe Hosted Checkout
    await redirectToStripeHostedCheckout({
      items: itemsPayload,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      shippingAddress: getFullAddressString(),
      shippingCountry: shippingCountry,
      shippingCost: shippingCost,
      orderNumber: orderNumber,
      paymentMethod: 'card'
    });
    setIsSubmitting(false);
  };

  const handleOpenPayNow = async () => {
    if (!validateDetails()) return;
    setIsSubmitting(true);

    const orderNumber = 'RD-PN-' + strtoupper(Math.random().toString(36).substring(2, 8));
    setActiveOrderNumber(orderNumber);

    const itemsPayload = cart.map((i) => ({
      id: i.product.id,
      title: i.product.title,
      price: Math.round(i.product.price * USD_TO_SGD * 100) / 100,
      quantity: i.quantity,
      type: i.product.type,
      image_url: i.product.image_url || ''
    }));

    await redirectToStripeHostedCheckout({
      items: itemsPayload,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      shippingAddress: getFullAddressString(),
      shippingCountry: shippingCountry,
      shippingCost: Math.round(shippingCost * USD_TO_SGD * 100) / 100,
      orderNumber: orderNumber,
      paymentMethod: 'paynow'
    });
    setIsSubmitting(false);
  };

  const executePayNowOrderSubmission = async () => {
    setIsSubmitting(true);

    const orderPayload = {
      order_number: activeOrderNumber || ('AA-SG' + Math.floor(100000 + Math.random() * 900000)),
      customer_name: customerName.trim() || 'Valued Collector',
      customer_email: customerEmail.trim(),
      shipping_country: shippingCountry,
      shipping_address: getFullAddressString(),
      payment_method: 'stripe_paynow',
      payment_status: 'paid',
      status: 'paid',
      total_amount: totalCost,
      shipping_cost: shippingCost,
      items: cart.map((i) => ({
        id: i.product.id,
        title: i.product.title,
        price: i.product.price,
        quantity: i.quantity,
        weight: i.product.weight,
        type: i.product.type,
        image_url: i.product.image_url || ''
      }))
    };

    const res = await submitOrder(orderPayload);
    setIsSubmitting(false);

    if (res.status === 'success') {
      clearCart();
      onSuccessOrder({
        ...res,
        items: cart.map(i => ({ title: i.product.title, image_url: i.product.image_url, price: i.product.price }))
      });
    }
  };

  function strtoupper(str: string): string {
    return str.toUpperCase();
  }

  if (cart.length === 0) {
    return (
      <div className="bg-chalk py-24 text-center space-y-4 px-4 min-h-[70vh]">
        <h2 className="font-serif text-3xl text-amaranth font-bold">Your Cart is Empty</h2>
        <p className="text-xs text-[#3D262A] font-medium">Select artworks from the gallery shop before proceeding to checkout.</p>
        <button
          onClick={onBackToShop}
          className="px-6 py-3 bg-amaranth text-chalk text-xs font-bold uppercase tracking-widest hover:bg-thulian transition-colors rounded-lg shadow-xs cursor-pointer"
        >
          Return to Gallery Shop
        </button>
      </div>
    );
  }

  return (
    <div className="bg-chalk py-12 px-4 sm:px-6 lg:px-8 min-h-[85vh]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back link */}
        <button
          onClick={onBackToShop}
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-chalk bg-amaranth px-4 py-2 rounded-lg hover:bg-thulian transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gallery Collection</span>
        </button>

        {/* Title Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 bg-chalk p-6 rounded-2xl border-2 border-pomelo shadow-xs">
          <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold tracking-widest uppercase bg-brook/40 text-amaranth px-3 py-1 rounded border border-pomelo/40">
            <Sparkles className="w-3 h-3 text-amaranth" />
            <span>Secure Fine Art Acquisition</span>
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-amaranth">
            Acquire Artwork
          </h1>
          <p className="text-xs text-[#3D262A] font-bold pt-1">
            Complete your collector details and delivery address below.
          </p>
        </div>

        {/* Form Validation Error Alert */}
        {formError && (
          <div className="p-4 bg-thulian/40 text-amaranth rounded-xl border-2 border-amaranth text-xs font-bold shadow-xs">
            ⚠️ {formError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Customer & Delivery Address Form */}
          <div className="lg:col-span-7 bg-chalk p-6 sm:p-8 rounded-2xl border-2 border-pomelo shadow-xs space-y-6">
            
            {/* Step 1: Collector Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-pomelo/40 pb-2">
                <User className="w-4 h-4 text-amaranth" />
                <h3 className="font-serif text-lg font-bold text-amaranth uppercase tracking-wide">
                  01. Collector Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                    Full Name <span className="text-amaranth">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                    Email Address <span className="text-amaranth">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. eleanor@collector.com"
                    className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                  Contact Phone Number (For Art Courier / SMS Updates)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +65 9123 4567 or +1 (555) 019-2834"
                  className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs"
                />
              </div>
            </div>

            {/* Step 2: Shipping / Delivery Address */}
            <div className="space-y-4 pt-4 border-t border-pomelo/40">
              <div className="flex items-center space-x-2 border-b border-pomelo/40 pb-2">
                <MapPin className="w-4 h-4 text-amaranth" />
                <h3 className="font-serif text-lg font-bold text-amaranth uppercase tracking-wide">
                  02. Delivery & Destination Address
                </h3>
              </div>

              {isDigitalOnly ? (
                <div className="p-4 bg-brook/30 rounded-xl border border-pomelo/50 text-xs font-semibold text-[#3D262A] space-y-1">
                  <p className="font-bold text-amaranth">✨ Instant Digital Delivery Mode</p>
                  <p className="text-[11px] text-[#3D262A]/80">Your cart contains ultra-high-resolution digital artworks. Files are delivered instantly to your email upon checkout with no physical freight needed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                      Destination Country <span className="text-amaranth">*</span>
                    </label>
                    <select
                      value={shippingCountry}
                      onChange={(e) => setShippingCountry(e.target.value)}
                      className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs cursor-pointer"
                    >
                      <option value="SG">Singapore</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="CA">Canada</option>
                      <option value="MY">Malaysia</option>
                      <option value="GLOBAL">Rest of World</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                      Street Address & Apt / Suite <span className="text-amaranth">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. 24 Orchard Boulevard, #12-04"
                      className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                        City <span className="text-amaranth">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Singapore / New York"
                        className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={stateProvince}
                        onChange={(e) => setStateProvince(e.target.value)}
                        placeholder="e.g. NY / NSW"
                        className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">
                        Postal / Zip <span className="text-amaranth">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 248648"
                        className="w-full bg-chalk/90 border-2 border-pomelo p-2.5 text-xs text-[#3D262A] font-bold focus:outline-none focus:border-amaranth rounded-lg shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment Method Selector */}
            <div className="space-y-4 pt-4 border-t border-pomelo/40">
              <div className="flex items-center space-x-2 border-b border-pomelo/40 pb-2">
                <ShieldCheck className="w-4 h-4 text-amaranth" />
                <h3 className="font-serif text-lg font-bold text-amaranth uppercase tracking-wide">
                  03. Payment Selection
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe_hosted')}
                  className={`py-3.5 px-4 rounded-xl font-bold text-xs transition-all border flex items-center justify-center space-x-2 cursor-pointer ${
                    paymentMethod === 'stripe_hosted'
                      ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                      : 'bg-brook/40 text-amaranth border-pomelo/40 hover:bg-thulian hover:text-chalk'
                  }`}
                >
                  <span>Stripe (Card / Apple Pay / Google Pay)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe_paynow')}
                  className={`py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                    paymentMethod === 'stripe_paynow'
                      ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                      : 'bg-brook/40 text-amaranth border-pomelo/40 hover:bg-thulian hover:text-chalk'
                  }`}
                >
                  PayNow SG (QR Code)
                </button>
              </div>

              {/* Action Buttons */}
              {paymentMethod === 'stripe_hosted' && (
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDirectStripeCheckout}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amaranth text-chalk text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-thulian transition-all shadow-md rounded-xl border border-amaranth flex items-center justify-center space-x-2 hover:scale-[1.01] cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Opening Stripe Checkout...' : `Proceed to Stripe Checkout • $${totalCost.toLocaleString()}`}</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </button>
                  <div className="flex items-center justify-center space-x-2 text-[11px] text-[#3D262A]/80 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amaranth" />
                    <span>Redirects directly to official <strong>checkout.stripe.com</strong> for card payment.</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'stripe_paynow' && (
                <div className="space-y-3 pt-2">
                  <div className="bg-brook/40 border border-pomelo/40 rounded-xl p-3 text-center space-y-0.5">
                    <p className="text-[11px] font-bold text-[#3D262A]/70 uppercase tracking-wider">PayNow Transfer Amount (SGD)</p>
                    <p className="font-serif text-2xl font-bold text-amaranth">S${totalSgd.toLocaleString('en-SG', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-[#3D262A]/60 font-medium">≈ USD ${totalCost.toLocaleString()} · Rate: 1 USD = 1.35 SGD</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenPayNow}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amaranth text-chalk text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-thulian transition-all shadow-md rounded-xl border border-amaranth flex items-center justify-center space-x-2 hover:scale-[1.01] cursor-pointer disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Connecting to PayNow...' : `Pay via PayNow • S$${totalSgd.toLocaleString('en-SG', { minimumFractionDigits: 2 })}`}</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </button>
                  <div className="flex items-center justify-center space-x-2 text-[11px] text-[#3D262A]/80 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Exact amount pre-filled · Instant bank verification via DBS, OCBC, UOB & GrabPay</span>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Order Summary & Item Overview */}
          <div className="lg:col-span-5 bg-chalk p-6 sm:p-8 rounded-2xl border-2 border-pomelo shadow-xs space-y-6">
            
            <div className="flex justify-between items-center border-b-2 border-pomelo pb-3">
              <h2 className="font-serif text-xl text-amaranth font-bold">
                Order Summary ({cart.length})
              </h2>
              <span className="text-xs font-mono font-bold text-amaranth bg-brook/40 px-3 py-1 rounded border border-pomelo/40">
                Total: ${totalCost.toLocaleString()}
              </span>
            </div>

            {/* Cart Item Cards */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex space-x-3 items-center border-b border-pomelo/20 pb-3 bg-pomelo/15 p-3 rounded-xl border border-pomelo/40">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-14 h-14 object-cover bg-chalk rounded-lg border border-pomelo/40 shrink-0"
                  />
                  <div className="flex-1 text-xs space-y-0.5 min-w-0">
                    <h3 className="font-serif font-bold text-[#3D262A] text-sm truncate">{product.title}</h3>
                    <p className="text-[#3D262A]/80 text-[10px] font-semibold">
                      {product.type === 'original'
                        ? 'Original Artwork (1 of 1)'
                        : product.type === 'digital'
                        ? 'Instant Digital Download'
                        : 'Fine Art Print'}
                    </p>
                    <p className="text-pomelo font-mono font-bold text-[11px]">Qty: {quantity}</p>
                  </div>
                  <div className="font-mono font-bold text-sm text-[#3D262A]">
                    ${(product.price * quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="pt-3 border-t-2 border-pomelo space-y-2 text-xs bg-brook/30 p-4 rounded-xl border border-pomelo/40">
              <div className="flex justify-between items-baseline font-serif text-2xl font-bold text-amaranth">
                <span>Total</span>
                <span className="font-sans text-3xl text-amaranth">${totalCost.toLocaleString()}</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* PayNow SG Modal */}
      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        amountSgd={totalSgd}
        amountUsd={totalCost}
        orderNumber={activeOrderNumber}
        onConfirmSuccess={() => {
          setShowPayNowModal(false);
          executePayNowOrderSubmission();
        }}
      />
    </div>
  );
};
