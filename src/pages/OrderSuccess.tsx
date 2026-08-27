import React from 'react';
import { CheckCircle, Download, ArrowRight, Sparkles, ShieldCheck, AlertCircle, Package, MapPin } from 'lucide-react';

interface OrderSuccessProps {
  orderInfo: any;
  onReturnHome: () => void;
}

export const OrderSuccess: React.FC<OrderSuccessProps> = ({ orderInfo, onReturnHome }) => {
  const purchasedItems: any[] = orderInfo?.items || [];
  
  const digitalItems = purchasedItems.filter(
    (i) => i.type === 'digital' || (i.title && i.title.toLowerCase().includes('digital'))
  );
  
  const physicalItems = purchasedItems.filter(
    (i) => i.type !== 'digital' && !(i.title && i.title.toLowerCase().includes('digital'))
  );

  return (
    <div className="bg-chalk py-16 px-4 sm:px-6 lg:px-8 min-h-[85vh] flex items-center justify-center">
      <div className="max-w-2xl w-full bg-brook/30 p-8 sm:p-12 rounded-2xl border-2 border-pomelo shadow-md space-y-8 text-center">
        
        {/* Success Icon */}
        <div className="w-20 h-20 bg-amaranth text-chalk rounded-full flex items-center justify-center mx-auto border-2 border-pomelo shadow-sm">
          <CheckCircle className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="inline-flex items-center space-x-1.5 text-[10px] tracking-widest font-bold uppercase bg-brook text-amaranth px-3 py-1 rounded-full border border-pomelo/40 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FINE ART ACQUISITION CONFIRMED</span>
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-amaranth pt-1">
            Thank You for Your Order
          </h1>
          <p className="text-xs text-[#3D262A] font-semibold">
            Order Reference Number: <span className="font-mono font-bold text-amaranth">{orderInfo?.order_number || 'RD-STRIPE-LIVE'}</span>
          </p>
        </div>

        {/* Confirmation Container */}
        <div className="bg-chalk p-6 sm:p-8 text-left border-2 border-pomelo rounded-2xl shadow-xs space-y-5 text-xs font-semibold">
          
          <div className="flex justify-between items-center pb-3 border-b border-pomelo/40">
            <span className="text-pomelo font-bold uppercase text-[11px] tracking-wider">Payment Status:</span>
            <span className="bg-brook text-amaranth text-xs font-bold px-3 py-1 rounded-full border border-pomelo/40 shadow-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Paid via Stripe Live
            </span>
          </div>

          {/* PHYSICAL ARTWORK DELIVERY CARD (Originals & Fine Art Prints) */}
          {physicalItems.length > 0 && (
            <div className="p-6 bg-brook/40 border-2 border-pomelo/60 rounded-xl space-y-4 shadow-xs">
              <div className="flex items-center space-x-2 text-amaranth font-bold text-sm">
                <Package className="w-5 h-5 text-amaranth" />
                <span>Original Artwork & Archival Delivery Details</span>
              </div>

              {orderInfo?.shipping_address && (
                <div className="bg-chalk p-3.5 rounded-xl border border-pomelo/40 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-amaranth">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Collector Delivery Destination:</span>
                  </div>
                  <p className="text-xs font-bold text-[#3D262A]">
                    {orderInfo.shipping_address}
                  </p>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pomelo block">
                  Purchased Artworks ({physicalItems.length}):
                </span>
                {physicalItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-chalk p-3 rounded-xl border border-pomelo/40">
                    <div className="flex items-center space-x-3">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded-lg border border-pomelo/40 shrink-0" />
                      )}
                      <div>
                        <span className="font-serif font-bold text-amaranth text-sm block">{item.title}</span>
                        <span className="text-[10px] text-pomelo font-bold uppercase">
                          {item.type === 'original' ? 'Original Artwork (1 of 1)' : 'Fine Art Archival Print'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amaranth text-xs">
                      ${Number(item.price || 0).toLocaleString()} USD
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-[#3D262A] font-medium leading-relaxed bg-pomelo/10 p-3 rounded-lg border border-pomelo/30">
                ✨ <strong>Studio Notice:</strong> Rohma has received your original acquisition in the studio. Your artwork will be safely varnished, packaged with archival-grade protection, and prepared for dispatch.
              </p>
            </div>
          )}

          {/* DIGITAL ARTWORK DOWNLOAD CARD (Digital Downloads Only) */}
          {digitalItems.length > 0 && (
            <div className="p-6 bg-thulian/30 border-2 border-thulian/60 rounded-xl space-y-4 shadow-xs">
              <div className="flex items-center space-x-2.5 text-amaranth font-bold text-sm">
                <Download className="w-5 h-5 text-amaranth" />
                <span>Your Purchased Master Digital Artwork Download</span>
              </div>

              <p className="text-xs text-[#3D262A] font-medium leading-relaxed">
                Your acquisition has been verified. Click below to download your high-resolution master file:
              </p>

              <div className="space-y-3 pt-2">
                {digitalItems.map((item, idx) => {
                  const title = item.title || 'Artwork';
                  const imgUrl = item.image_url || '';
                  const isDataUrl = imgUrl.startsWith('data:image/');
                  const downloadHref = isDataUrl
                    ? imgUrl
                    : `/api/download.php?file=${encodeURIComponent(title)}&url=${encodeURIComponent(imgUrl)}`;

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row items-center justify-between bg-chalk p-4 rounded-xl border-2 border-amaranth/30 shadow-xs gap-3">
                      <div className="flex items-center space-x-3 text-left">
                        {imgUrl && !isDataUrl && (
                          <img src={imgUrl} alt={title} className="w-12 h-12 object-cover rounded-lg border border-pomelo/40 shrink-0" />
                        )}
                        <div>
                          <span className="font-serif font-bold text-amaranth text-base block">{title}</span>
                          <span className="text-[10px] text-pomelo font-bold uppercase">Master High-Resolution File</span>
                        </div>
                      </div>

                      <a
                        href={downloadHref}
                        download={`${title}.jpg`}
                        className="w-full sm:w-auto px-6 py-3 bg-amaranth text-chalk text-xs font-bold uppercase tracking-wider hover:bg-thulian transition-all shadow-md rounded-xl inline-flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap hover:scale-[1.02]"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD ARTWORK NOW</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onReturnHome}
            className="px-8 py-3.5 bg-amaranth text-chalk text-xs font-bold uppercase tracking-widest hover:bg-thulian transition-all inline-flex items-center space-x-2 shadow-xs rounded-xl cursor-pointer"
          >
            <span>Return to Portfolio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
