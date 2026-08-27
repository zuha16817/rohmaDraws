import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';

interface PayNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountSgd: number;
  amountUsd: number;
  orderNumber: string;
  onConfirmSuccess: () => void;
}

export const PayNowModal: React.FC<PayNowModalProps> = ({
  isOpen,
  onClose,
  amountSgd,
  amountUsd,
  orderNumber,
  onConfirmSuccess
}) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minute countdown
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(600);
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleSimulatePayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onConfirmSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-text-primary/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-chalk text-text-primary max-w-md w-full p-8 rounded-2xl shadow-2xl z-10 space-y-5 border-2 border-pomelo">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-pomelo/30 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-amaranth text-chalk font-bold flex items-center justify-center text-xs">
              PN
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-amaranth">PayNow Singapore</h3>
              <p className="text-[11px] text-pomelo font-medium">DBS · UOB · OCBC · PayLah! · GrabPay</p>
            </div>
          </div>
          <button onClick={onClose} className="text-pomelo hover:text-amaranth">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Due Banner */}
        <div className="bg-amaranth/10 border-2 border-amaranth/30 rounded-xl p-4 text-center space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3D262A]/60">Amount to Transfer</p>
          <p className="font-serif text-4xl font-bold text-amaranth tracking-tight">
            S${amountSgd.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#3D262A]/60 font-medium">
            ≈ USD ${amountUsd.toLocaleString()} · Rate: 1 USD = 1.35 SGD
          </p>
        </div>

        {/* Instruction Alert */}
        <div className="flex items-start space-x-2 bg-brook/40 border border-pomelo/40 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amaranth shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#3D262A] font-semibold leading-relaxed">
            Scan the QR below, then <strong>manually enter S${amountSgd.toLocaleString('en-SG', { minimumFractionDigits: 2 })}</strong> as the transfer amount in your banking app.
          </p>
        </div>

        {/* QR Code */}
        <div className="text-center space-y-2">
          <div className="inline-block p-3 bg-white border-2 border-dashed border-pomelo rounded-xl relative mx-auto">
            <img
              src="/images/paynow_qr.png"
              alt="Rohma Draws PayNow QR Code"
              className="w-52 h-52 mx-auto object-contain"
            />
            {isVerifying && (
              <div className="absolute inset-0 bg-chalk/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 space-y-2 rounded-xl">
                <div className="w-8 h-8 border-4 border-amaranth border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-amaranth">Verifying Payment...</p>
              </div>
            )}
          </div>
          <p className="text-[10px] font-mono text-[#3D262A]/60">Order Ref: {orderNumber}</p>
        </div>

        {/* Timer */}
        <div className="bg-thulian/20 text-amaranth p-3 rounded-lg text-center text-xs flex justify-between items-center border border-thulian/40">
          <span className="font-bold">QR Expires In:</span>
          <span className="font-mono font-bold text-sm">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleSimulatePayment}
            disabled={isVerifying}
            className="w-full py-3.5 bg-amaranth text-chalk text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-thulian transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>I Have Paid — S${amountSgd.toLocaleString('en-SG', { minimumFractionDigits: 2 })}</span>
          </button>
          
          <div className="text-[11px] text-pomelo text-center flex items-center justify-center space-x-1 pt-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amaranth" />
            <span>Payment goes directly to Rohma Draws Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
