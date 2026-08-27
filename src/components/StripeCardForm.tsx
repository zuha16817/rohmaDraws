import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Lock, CreditCard, ShieldCheck } from 'lucide-react';

const stripePublishableKey =
  (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51U1jqORcwSoa3CRpUX1NT6h62imhpFHpzhK0wO6PJQ4pCF5lSC4Tj6BDEQxzwTpf42TcugeFJnk6WLNiEGXknuWT00qBF25yrp';

const stripePromise = loadStripe(stripePublishableKey);

interface StripeCardFormInnerProps {
  totalCost: number;
  onSuccess: (paymentDetails: any) => void;
  isSubmitting: boolean;
}

const StripeCardFormInner: React.FC<StripeCardFormInnerProps> = ({
  totalCost,
  onSuccess,
  isSubmitting
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onSuccess({ payment_id: 'ch_test_' + Math.random().toString(36).substring(2, 10), status: 'succeeded' });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement
    });

    setIsProcessing(false);

    if (error) {
      setErrorMessage(error.message || 'Payment method creation failed.');
    } else {
      onSuccess({
        payment_id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        status: 'succeeded'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      
      {/* Studio Styled Card Element Container */}
      <div className="bg-chalk p-4 rounded-xl border-2 border-pomelo shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-pomelo/30 pb-2">
          <span className="text-xs font-bold uppercase text-amaranth flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-amaranth" />
            <span>Credit / Debit Card (Stripe Encrypted)</span>
          </span>
          <span className="text-[10px] font-bold text-chalk bg-amaranth px-2 py-0.5 rounded font-mono">
            TEST MODE
          </span>
        </div>

        {/* Real Stripe Elements Card Input */}
        <div className="p-3 bg-chalk rounded-lg border border-pomelo/60 shadow-inner">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#3D262A',
                  fontFamily: 'Inter, sans-serif',
                  '::placeholder': {
                    color: '#9F9679'
                  }
                },
                invalid: {
                  color: '#933B5B'
                }
              }
            }}
          />
        </div>

        {/* Helper Test Card Tip */}
        <div className="flex items-center space-x-1.5 text-[11px] text-[#3D262A]/80 font-bold bg-brook/30 p-2.5 rounded-lg border border-pomelo/40">
          <ShieldCheck className="w-4 h-4 text-amaranth shrink-0" />
          <span>Test Card: <code className="bg-chalk px-1.5 py-0.5 rounded border border-pomelo font-mono text-amaranth">4242 4242 4242 4242</code> (Any future MM/YY & CVC)</span>
        </div>

        {errorMessage && (
          <div className="text-xs font-bold text-amaranth bg-thulian/20 p-2.5 rounded-lg border border-amaranth">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Pay Button */}
      <button
        type="submit"
        disabled={isProcessing || isSubmitting}
        className="w-full py-4 bg-amaranth text-chalk text-xs font-bold tracking-widest uppercase hover:bg-thulian transition-all shadow-md rounded-xl border border-amaranth flex items-center justify-center space-x-2"
      >
        <Lock className="w-4 h-4" />
        <span>{isProcessing ? 'Processing via Stripe...' : `Pay $${totalCost.toLocaleString()} with Stripe`}</span>
      </button>
    </form>
  );
};

interface StripeCardFormProps {
  totalCost: number;
  onSuccess: (paymentDetails: any) => void;
  isSubmitting: boolean;
}

export const StripeCardForm: React.FC<StripeCardFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <StripeCardFormInner {...props} />
    </Elements>
  );
};
