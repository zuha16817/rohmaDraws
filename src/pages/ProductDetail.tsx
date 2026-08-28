import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Download, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Product, ProductType } from '../types';
import { useCart } from '../context/CartContext';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(product.image_url);

  // Enabled format options controlled by Rohma in Admin Dashboard
  const isOriginalPainting = product.type === 'original';
  const allowOriginal = isOriginalPainting && product.allow_original !== false;
  const allowPrint = product.allow_print !== false;
  const allowDigital = product.allow_digital !== false;

  const printPrice = product.print_price || (isOriginalPainting ? Math.max(25, Math.round(product.price * 0.25)) : product.price);
  const digitalPrice = product.digital_price || (product.type === 'digital' ? product.price : 15);

  // Determine initial active format edition
  const getInitialFormat = (): 'original' | 'print' | 'digital' => {
    if (isOriginalPainting && allowOriginal) return 'original';
    if (allowPrint) return 'print';
    if (allowDigital) return 'digital';
    return product.type;
  };

  const [selectedFormat, setSelectedFormat] = useState<'original' | 'print' | 'digital'>(getInitialFormat());

  useEffect(() => {
    if (selectedFormat === 'original' && !allowOriginal) {
      if (allowPrint) setSelectedFormat('print');
      else if (allowDigital) setSelectedFormat('digital');
    } else if (selectedFormat === 'print' && !allowPrint) {
      if (allowOriginal) setSelectedFormat('original');
      else if (allowDigital) setSelectedFormat('digital');
    } else if (selectedFormat === 'digital' && !allowDigital) {
      if (allowOriginal) setSelectedFormat('original');
      else if (allowPrint) setSelectedFormat('print');
    }
  }, [product, allowOriginal, allowPrint, allowDigital]);

  useEffect(() => {
    setSelectedImage(product.image_url);
  }, [product]);

  const images = [product.image_url, ...(product.secondary_images || [])].filter(Boolean);

  // Calculate variant-specific dynamic properties
  const getActiveVariant = () => {
    if (selectedFormat === 'original' && allowOriginal) {
      return {
        price: product.price,
        type: 'original' as ProductType,
        badge: 'ORIGINAL ARTWORK (1 OF 1)',
        weight: product.weight,
        formatLabel: 'Original Canvas Painting (1 of 1)',
        title: product.title
      };
    }

    if (selectedFormat === 'print') {
      return {
        price: printPrice,
        type: 'print' as ProductType,
        badge: 'FINE ART PRINT EDITION',
        weight: product.type === 'print' ? product.weight : 0.4,
        formatLabel: 'Archival Fine Art Print Edition',
        title: product.type === 'print' ? product.title : `${product.title} (Fine Art Print)`
      };
    }

    // Digital
    return {
      price: digitalPrice,
      type: 'digital' as ProductType,
      badge: 'INSTANT DIGITAL DOWNLOAD',
      weight: 0,
      formatLabel: 'Instant High-Res Digital Copy',
      title: product.type === 'digital' ? product.title : `${product.title} (Digital Copy)`
    };
  };

  const activeVariant = getActiveVariant();
  const availableOptionCount = (allowOriginal ? 1 : 0) + (allowPrint ? 1 : 0) + (allowDigital ? 1 : 0);

  const handleAddToCart = () => {
    const itemToAdd: Product = {
      ...product,
      title: activeVariant.title,
      price: activeVariant.price,
      type: activeVariant.type,
      weight: activeVariant.weight
    };
    addToCart(itemToAdd, 1);
  };

  const isSoldOut = product.stock_quantity === 0 || product.badge === 'SOLD';

  return (
    <div className="bg-chalk py-12 px-4 sm:px-6 lg:px-8 min-h-[85vh]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-chalk bg-amaranth px-4 py-2 rounded-lg hover:bg-thulian transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Gallery Image Left Column */}
          <div className="md:col-span-7 space-y-4">
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="min-h-[380px] sm:min-h-[520px] max-h-[75vh] w-full bg-brook/30 rounded-2xl border-2 border-pomelo shadow-xs relative flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
            >
              {/* Full Artwork Uncropped */}
              <img
                src={selectedImage}
                alt={product.title}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm pointer-events-none transition-all duration-300 select-none"
              />

              {/* Repeating Anti-Screenshot Watermark Grid */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none flex flex-col justify-around overflow-hidden opacity-15 rotate-[-24deg] scale-125">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="whitespace-nowrap text-[12px] sm:text-[14px] font-black tracking-[0.35em] text-[#1c1c1c] uppercase text-center select-none">
                    ROHMA DRAWS STUDIO • PREVIEW COPY • © ROHMA DRAWS • DO NOT REPRODUCE
                  </div>
                ))}
              </div>

              {/* Corner Copyright Seal */}
              <div className="absolute bottom-3 right-3 pointer-events-none select-none bg-black/45 backdrop-blur-xs text-chalk text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow-sm border border-white/20">
                <span>© Rohma Draws Studio</span>
              </div>

              {isSoldOut && selectedFormat === 'original' && (
                <div className="absolute top-4 left-4 bg-thulian text-chalk font-bold text-xs px-3.5 py-1.5 uppercase tracking-widest border border-amaranth shadow-sm rounded-md">
                  Original Sold Out
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 shrink-0 bg-brook/30 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                      selectedImage === img ? 'border-amaranth shadow-sm ring-2 ring-amaranth/30' : 'border-pomelo/50 opacity-70 hover:opacity-100 hover:border-amaranth'
                    }`}
                  >
                    <img src={img} alt={`${product.title} View ${idx + 1}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Right Column */}
          <div className="md:col-span-5 space-y-6 bg-chalk p-8 rounded-2xl border-2 border-pomelo shadow-xs">
            <div className="space-y-3 pb-6 border-b border-pomelo/40">
              <span className="text-[11px] tracking-widest font-bold uppercase text-chalk bg-amaranth px-3 py-1 rounded shadow-xs">
                {activeVariant.badge}
              </span>
              
              <h1 className="font-serif text-3xl sm:text-4xl text-amaranth font-bold tracking-tight pt-1">
                {product.title}
              </h1>

              <div className="font-sans text-2xl font-bold text-amaranth bg-brook/30 px-4 py-2 rounded-lg border border-pomelo/40 inline-block shadow-xs">
                ${activeVariant.price.toLocaleString()} USD
              </div>
            </div>

            {/* Format Selection Option Tabs (Available for Originals, Prints, & Digital Copies) */}
            {availableOptionCount > 0 && (
              <div className="space-y-3 p-4 bg-pomelo/20 rounded-xl border border-pomelo/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amaranth flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amaranth" />
                    <span>Select Purchasing Format</span>
                  </label>
                  <span className="text-[10px] text-amaranth font-bold bg-brook/50 px-2 py-0.5 rounded border border-pomelo/40">
                    {availableOptionCount} {availableOptionCount === 1 ? 'Option' : 'Options'} Available
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Option 1: Original Canvas Painting (If Original & Enabled by Rohma) */}
                  {allowOriginal && (
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('original')}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        selectedFormat === 'original'
                          ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                          : 'bg-chalk text-[#3D262A] border-pomelo/40 hover:bg-thulian/20'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">Original Painting (1 of 1)</div>
                        <div className={`text-[11px] ${selectedFormat === 'original' ? 'text-chalk/80' : 'text-[#3D262A]/70'}`}>
                          Hand-painted physical canvas artwork
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs">${product.price} USD</div>
                        {selectedFormat === 'original' && <Check className="w-4 h-4 ml-auto mt-0.5" />}
                      </div>
                    </button>
                  )}

                  {/* Option 2: Fine Art Print Edition (If Enabled by Rohma) */}
                  {allowPrint && (
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('print')}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        selectedFormat === 'print'
                          ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                          : 'bg-chalk text-[#3D262A] border-pomelo/40 hover:bg-thulian/20'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">Archival Fine Art Print</div>
                        <div className={`text-[11px] ${selectedFormat === 'print' ? 'text-chalk/80' : 'text-[#3D262A]/70'}`}>
                          Museum-quality physical paper reproduction
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs">${printPrice} USD</div>
                        {selectedFormat === 'print' && <Check className="w-4 h-4 ml-auto mt-0.5" />}
                      </div>
                    </button>
                  )}

                  {/* Option 3: Instant Digital Download (If Enabled by Rohma) */}
                  {allowDigital && (
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('digital')}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        selectedFormat === 'digital'
                          ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                          : 'bg-chalk text-[#3D262A] border-pomelo/40 hover:bg-thulian/20'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">Instant Digital Download</div>
                        <div className={`text-[11px] ${selectedFormat === 'digital' ? 'text-chalk/80' : 'text-[#3D262A]/70'}`}>
                          High-resolution digital printable file
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs">${digitalPrice} USD</div>
                        {selectedFormat === 'digital' && <Check className="w-4 h-4 ml-auto mt-0.5" />}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notice if 0 options enabled by Rohma */}
            {availableOptionCount === 0 && (
              <div className="p-4 bg-thulian/20 text-amaranth rounded-xl border border-thulian flex items-center space-x-2 text-xs font-bold shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No purchasing format options are currently enabled for this artwork.</span>
              </div>
            )}

            {/* Description & Specifications */}
            <div className="space-y-4 text-xs text-text-primary leading-relaxed font-medium">
              <p>{product.description}</p>

              <div className="bg-chalk p-4 space-y-2 border border-pomelo/40 rounded-lg shadow-xs">
                {product.dimensions && (
                  <div className="flex justify-between border-b border-pomelo/20 pb-1">
                    <span className="text-pomelo font-bold">Dimensions:</span>
                    <span className="font-bold text-amaranth">{product.dimensions}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-pomelo font-bold">Medium / Format:</span>
                  <span className="font-bold text-amaranth uppercase">{activeVariant.formatLabel}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddToCart}
              disabled={(isSoldOut && selectedFormat === 'original') || availableOptionCount === 0}
              className={`w-full py-4 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center space-x-2 rounded-xl shadow-xs cursor-pointer ${
                (isSoldOut && selectedFormat === 'original') || availableOptionCount === 0
                  ? 'bg-pomelo/40 text-pomelo border border-pomelo cursor-not-allowed'
                  : 'bg-amaranth text-chalk hover:bg-thulian border border-amaranth hover:scale-[1.01]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {availableOptionCount === 0
                  ? 'Option Disabled'
                  : isSoldOut && selectedFormat === 'original'
                  ? 'Original Sold Out'
                  : `Add ${selectedFormat.toUpperCase()} to Collection Bag`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
