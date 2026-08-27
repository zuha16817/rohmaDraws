import React from 'react';
import { Sparkles } from 'lucide-react';
import { Product } from '../types';
import { CylindricalCarousel3D } from '../components/CylindricalCarousel3D';
import { CommissionsScrollCard } from '../components/CommissionsScrollCard';

interface HomeProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  setActiveTab: (tab: string) => void;
  commissionCardImage?: string;
  commissionsOpen?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  products,
  onSelectProduct,
  setActiveTab,
  commissionCardImage,
  commissionsOpen = true
}) => {
  return (
    <div className="space-y-0 bg-chalk">
      
      {/* 1. HERO BANNER - Full Viewport Screen Height */}
      <section className="relative min-h-[calc(100vh-6rem)] h-[calc(100vh-6rem)] flex items-center justify-center overflow-hidden bg-chalk border-b-2 border-pomelo">
        <div className="absolute inset-0 z-0 opacity-35">
          <img
            src="/images/hero_swallow.jpg"
            alt="Rohma Draws Sparrow Artwork Installation"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Hero Overlay Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-20 space-y-6">
          <span className="inline-flex items-center space-x-2 text-xs font-bold tracking-widest uppercase bg-brook text-amaranth px-4 py-1.5 rounded-full border border-pomelo shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amaranth" />
            <span>Rohma Draws Studio • Fine Art Collection</span>
          </span>
          <h1
            className="font-serif text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-amaranth leading-[1.05]"
            style={{
              textShadow: '0 2px 8px rgba(227, 214, 191, 0.85), 0 0 2px #E3D6BF'
            }}
          >
            Art that breathes life into space.
          </h1>
        </div>
      </section>

      {/* 2. 3D CYLINDRICAL SCROLL CAROUSEL SHOWCASE WITH VIEW ALL BUTTON */}
      <section className="relative z-10">
        <CylindricalCarousel3D
          products={products}
          onSelectProduct={onSelectProduct}
          onViewAll={() => setActiveTab('shop')}
        />
      </section>

      {/* 3. DYNAMIC COMMISSIONS SCROLL CARD */}
      <section className="relative z-10">
        <CommissionsScrollCard
          key={commissionCardImage}
          onBookCommission={() => setActiveTab('commission')}
          imageUrl={commissionCardImage}
          commissionsOpen={commissionsOpen}
        />
      </section>
    </div>
  );
};
