import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Product } from '../types';
import { Eye, ArrowUpDown, ArrowRight } from 'lucide-react';

interface CylindricalCarousel3DProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onViewAll?: () => void;
}

export const CylindricalCarousel3D: React.FC<CylindricalCarousel3DProps> = ({ products, onSelectProduct, onViewAll }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateZ, setTranslateZ] = useState<number>(420);
  const [isMobile, setIsMobile] = useState(false);

  // Touch drag state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragStartRotation, setDragStartRotation] = useState(0);

  // Manual rotation driven by touch on mobile
  const manualRotation = useMotionValue(0);
  const springManual = useSpring(manualRotation, { stiffness: 120, damping: 20, restDelta: 0.001 });

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Responsive 3D Cylinder Radius
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setTranslateZ(245);
      } else if (window.innerWidth < 1024) {
        setTranslateZ(320);
      } else {
        setTranslateZ(390);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll integration — only used on desktop
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25, restDelta: 0.001 });
  const scrollRotateY = useTransform(smoothProgress, [0, 1], [0, 360]);

  // On desktop: scroll drives rotation. On mobile: touch drag only (scroll contribution zeroed out)
  const scrollContribution = useTransform(scrollRotateY, (v) => (isMobile ? 0 : v));
  const rotateY = useTransform(
    [scrollContribution, springManual],
    ([scroll, manual]: number[]) => scroll + manual
  );

  // Curated Carousel Artworks: prioritized by Rohma's Admin Carousel Curator
  const featured = products
    .filter((p) => p.is_featured)
    .sort((a, b) => (a.carousel_order ?? 0) - (b.carousel_order ?? 0));

  // If Rohma has selected at least 2 artworks for carousel, display them in her curated order.
  // Otherwise, gracefully fallback to the latest products.
  const carouselItems = featured.length >= 2 ? featured : products.slice(0, 8);
  const totalItems = carouselItems.length;

  // Touch handlers for smooth continuous drag rotation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setDragStartRotation(manualRotation.get());
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dx = e.touches[0].clientX - touchStartX;
    // 280px drag = full 360° rotation
    manualRotation.set(dragStartRotation + dx * (360 / 380));
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  const getBadgeColor = (product: Product) => {
    if (product.stock_quantity === 0 || product.badge === 'SOLD') return 'bg-thulian text-chalk';
    if (product.type === 'digital') return 'bg-amaranth text-chalk';
    return 'bg-brook text-amaranth border border-pomelo';
  };

  return (
    // Mobile: fixed height (no 180vh scroll trap). Desktop: 180vh sticky scroll section.
    <div
      ref={containerRef}
      className={`relative bg-chalk border-b-2 border-pomelo ${isMobile ? '' : 'h-[180vh]'}`}
    >
      {/* Sticky on desktop, normal flow on mobile */}
      <div
        className={`${isMobile ? 'relative' : 'sticky top-20'} h-[640px] sm:h-[720px] lg:h-[760px] w-full flex flex-col items-center justify-center overflow-hidden bg-chalk pb-8`}
        style={{ perspective: '1100px', perspectiveOrigin: '50% 50%' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Section Heading & Instruction Pill */}
        <div className="absolute top-4 sm:top-6 z-30 text-center space-y-2 w-full px-4 flex flex-col items-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amaranth tracking-tight pointer-events-none">
            Featured Projects
          </h2>
          <div className="flex items-center justify-center">
            {/* Mobile hint */}
            <span className="inline-flex md:hidden items-center space-x-2 text-[11px] text-amaranth font-bold tracking-widest uppercase bg-brook/90 px-4 py-1.5 rounded-full border border-pomelo shadow-xs pointer-events-none">
              <ArrowRight className="w-3.5 h-3.5 text-amaranth" />
              <span>Swipe left or right to rotate</span>
            </span>
            {/* Desktop hint */}
            <span className="hidden md:inline-flex items-center space-x-2 text-[11px] text-amaranth font-bold tracking-widest uppercase bg-brook/90 px-4 py-1.5 rounded-full border border-pomelo shadow-xs pointer-events-none">
              <ArrowUpDown className="w-3.5 h-3.5 text-amaranth animate-pulse" />
              <span>Scroll down or up to rotate</span>
            </span>
          </div>
        </div>

        {/* 3D ROTATING CYLINDER CONTAINER */}
        <motion.div
          style={{ rotateY, transformStyle: 'preserve-3d' }}
          className="relative w-0 h-0 flex items-center justify-center pt-14 sm:pt-16"
        >
          {carouselItems.map((product, index) => {
            const angleY = (index * 360) / totalItems;
            return (
              <div
                key={product.id}
                style={{
                  position: 'absolute',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angleY}deg) translateZ(${translateZ}px)`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                className="flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              >
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  onClick={() => onSelectProduct(product)}
                  className="w-48 sm:w-60 lg:w-72 bg-[#D5C9B1] border-2 border-pomelo p-3 sm:p-3.5 rounded-2xl shadow-[0_16px_36px_-6px_rgba(70,45,20,0.18),0_6px_12px_-4px_rgba(70,45,20,0.12)] cursor-pointer hover:border-amaranth transition-all group"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-brook/40 border border-[#D8CCB5]">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[8px] sm:text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase rounded shadow-xs ${getBadgeColor(product)}`}>
                        {product.stock_quantity === 0 ? 'SOLD OUT' : product.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-amaranth/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-2.5 bg-chalk text-amaranth rounded-full shadow-md">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2.5 text-left space-y-1">
                    <h3 className="font-serif text-xs sm:text-sm font-bold text-[#212121] truncate group-hover:text-amaranth transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#212121]/70 font-semibold">{product.year || 2024}</span>
                      <span className="text-amaranth bg-brook px-2.5 py-0.5 rounded-full font-mono border border-pomelo font-bold">
                        ${product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Bottom View All Floating Button */}
        {onViewAll && (
          <div className="absolute bottom-5 z-30 pointer-events-auto">
            <button
              onClick={onViewAll}
              className="inline-flex items-center space-x-2 text-xs font-bold tracking-widest uppercase bg-amaranth text-chalk px-6 py-2.5 rounded-full hover:bg-thulian transition-all shadow-md border border-thulian hover:scale-105"
            >
              <span>VIEW ALL ARCHIVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
