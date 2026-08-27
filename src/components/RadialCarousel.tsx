import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Product } from '../types';
import { Sparkles, Eye, ArrowDown } from 'lucide-react';

interface RadialCarouselProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
}

export const RadialCarousel: React.FC<RadialCarouselProps> = ({ products, onSelectProduct }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState<number>(320);

  // Responsive radius calculation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setRadius(190);
      } else if (window.innerWidth < 1024) {
        setRadius(260);
      } else {
        setRadius(340);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Framer Motion Scroll Integration
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Physics: Smooth inertia wrapping
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001
  });

  // Rotation: 0 to 360 degrees rotation loop over scroll section
  const wheelRotation = useTransform(smoothProgress, [0, 1], [0, 360]);

  // Counter-Rotation Math: Inverse rotation (-r) so cards remain perfectly upright!
  const cardCounterRotation = useTransform(wheelRotation, (r) => -r);

  // 8 Orbital Artwork Cards
  const orbitItems = products.slice(0, 8);
  const totalItems = orbitItems.length;

  return (
    <div ref={containerRef} className="relative h-[250vh] bg-chalk border-b-4 border-pomelo">
      
      {/* Sticky Fullscreen Orbit Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-chalk">
        
        {/* Decorative Background Palette Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] rounded-full border-2 border-dashed border-pomelo animate-spin-slow" />
          <div className="absolute w-[400px] sm:w-[580px] lg:w-[750px] h-[400px] sm:h-[580px] lg:h-[750px] rounded-full border border-brook/60" />
        </div>

        {/* Section Heading Badge */}
        <div className="absolute top-24 z-20 text-center space-y-2 pointer-events-none">
          <span className="inline-flex items-center space-x-2 text-[11px] font-bold tracking-widest uppercase bg-brook text-amaranth px-4 py-1.5 rounded-full border border-pomelo shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scroll-Driven Gallery Orbit</span>
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-amaranth">
            Interactive Fine Art Wheel
          </h2>
          <p className="text-xs text-pomelo font-bold flex items-center justify-center gap-1">
            <ArrowDown className="w-3.5 h-3.5 animate-bounce text-amaranth" />
            Scroll to rotate the artwork orbit around Adele Auchterlonie
          </p>
        </div>

        {/* CENTRAL STICKY CIRCULAR FRAME (Artist Studio Portrait) */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full p-2 bg-chalk border-4 border-pomelo shadow-2xl">
            {/* Multi-Ring Palette Framing */}
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-amaranth relative shadow-inner">
              <img
                src="/images/artist_portrait.jpg"
                alt="Adele Auchterlonie Fine Artist Studio"
                className="w-full h-full object-cover filter saturate-[95%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amaranth/40 via-transparent to-transparent" />
            </div>

            {/* Center Artist Badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amaranth text-chalk px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md border border-chalk whitespace-nowrap">
              Adele Auchterlonie
            </div>
          </div>
        </div>

        {/* ROTATING ORBITAL WHEEL CONTAINER */}
        <motion.div
          style={{ rotate: wheelRotation }}
          className="absolute z-10 w-0 h-0 flex items-center justify-center pointer-events-auto"
        >
          {orbitItems.map((product, index) => {
            // Calculate static angle position for each item on the 360 degree circle
            const angleDeg = (index * 360) / totalItems;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = radius * Math.cos(angleRad);
            const y = radius * Math.sin(angleRad);

            const getBadgeColor = () => {
              if (product.stock_quantity === 0 || product.badge === 'SOLD') return 'bg-thulian text-chalk';
              if (product.type === 'digital') return 'bg-amaranth text-chalk';
              return 'bg-brook text-amaranth border border-pomelo';
            };

            return (
              <div
                key={product.id}
                style={{
                  transform: `translate3d(${x}px, ${y}px, 0px)`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                {/* COUNTER-ROTATING CARD: Rotates by (-wheelRotation) so content remains 100% upright! */}
                <motion.div
                  style={{ rotate: cardCounterRotation }}
                  whileHover={{ scale: 1.08 }}
                  onClick={() => onSelectProduct(product)}
                  className="w-40 sm:w-52 lg:w-60 bg-chalk border-2 border-pomelo p-2.5 sm:p-3 rounded-xl shadow-md cursor-pointer hover:border-amaranth transition-colors group"
                >
                  {/* Card Thumbnail */}
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-brook/30 border border-pomelo/40">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase rounded shadow-xs ${getBadgeColor()}`}>
                        {product.stock_quantity === 0 ? 'SOLD' : product.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Quick Eye Hover Action */}
                    <div className="absolute inset-0 bg-amaranth/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-2 bg-chalk text-amaranth rounded-full shadow-md">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="pt-2 text-left space-y-0.5">
                    <h3 className="font-serif text-xs sm:text-sm font-bold text-amaranth truncate group-hover:text-thulian transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-pomelo">{product.year || 2024}</span>
                      <span className="text-amaranth bg-brook/40 px-2 py-0.5 rounded font-mono">
                        ${product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Bottom Wheel Legend */}
        <div className="absolute bottom-8 z-20 text-[10px] font-bold tracking-widest text-pomelo uppercase bg-chalk px-4 py-1.5 rounded-full border border-pomelo shadow-xs">
          Orbit physics powered by Framer Motion Inertia Springs
        </div>
      </div>
    </div>
  );
};
