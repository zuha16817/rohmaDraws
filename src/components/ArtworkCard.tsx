import React from 'react';
import { Product } from '../types';

interface ArtworkCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({ product, onSelect }) => {
  const getBadgeStyle = () => {
    if (product.stock_quantity === 0 || product.badge === 'SOLD') {
      return 'bg-thulian text-chalk border border-amaranth shadow-xs';
    }
    if (product.type === 'digital' || product.badge === 'INSTANT DOWNLOAD') {
      return 'bg-amaranth text-chalk border border-thulian shadow-xs';
    }
    if (product.badge === 'LIMITED EDITION') {
      return 'bg-pomelo text-chalk border border-chalk shadow-xs';
    }
    return 'bg-brook text-[#212121] border border-pomelo font-bold shadow-xs';
  };

  const getBadgeLabel = () => {
    if (product.stock_quantity === 0 || product.badge === 'SOLD') return 'SOLD OUT';
    if (product.badge) return product.badge;
    return product.type === 'original' ? 'AVAILABLE' : product.type.toUpperCase();
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group cursor-pointer flex flex-col space-y-3 transition-all duration-300 hover:-translate-y-1.5 p-3.5 rounded-xl bg-pomelo/20 border-2 border-pomelo/60 shadow-xs hover:shadow-md hover:border-amaranth"
    >
      {/* Artwork Container */}
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-brook/30 rounded-lg border border-pomelo/40 shadow-inner flex items-center justify-center p-2 select-none"
      >
        {/* Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`text-[10px] font-bold tracking-widest px-2.5 py-0.5 uppercase rounded-md ${getBadgeStyle()}`}>
            {getBadgeLabel()}
          </span>
        </div>

        {/* Uncropped Artwork Image */}
        <img
          src={product.image_url}
          alt={product.title}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out select-none pointer-events-none"
          loading="lazy"
        />

        {/* Subtle Watermark Tag */}
        <div className="absolute bottom-1.5 right-1.5 pointer-events-none select-none text-[8px] font-bold text-black/35 uppercase tracking-wider">
          © Rohma Draws
        </div>

        {/* Hover Quick Overlay */}
        <div className="absolute inset-0 bg-text-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
          <span className="bg-amaranth text-chalk px-4 py-2 text-xs font-bold tracking-widest uppercase rounded shadow-md hover:bg-thulian transition-colors">
            View Details
          </span>
        </div>
      </div>

      {/* Metadata Row with Charcoal Typography */}
      <div className="flex justify-between items-baseline pt-1">
        <div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#212121] group-hover:text-amaranth transition-colors">
            {product.title}
          </h3>
          <p className="text-xs text-[#212121]/75 font-semibold tracking-wider">
            {product.year || 2024} • {product.type.toUpperCase()}
          </p>
        </div>
        <div className="font-mono text-sm font-bold text-[#212121] bg-pomelo/30 px-2.5 py-1 rounded border border-pomelo/50">
          ${product.price.toLocaleString()}
        </div>
      </div>
    </div>
  );
};
