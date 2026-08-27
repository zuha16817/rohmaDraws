import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, BookmarkCheck, Lock } from 'lucide-react';

interface CommissionsScrollCardProps {
  onBookCommission: () => void;
  imageUrl?: string;
  commissionsOpen?: boolean;
}

export const CommissionsScrollCard: React.FC<CommissionsScrollCardProps> = ({
  onBookCommission,
  imageUrl = '/images/Pink Lillies.jpg',
  commissionsOpen = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // 3 Scroll Phases / Steps
  const step1Opacity = useTransform(smoothProgress, [0, 0.28, 0.35], [1, 1, 0]);
  const step2Opacity = useTransform(smoothProgress, [0.32, 0.42, 0.62, 0.68], [0, 1, 1, 0]);
  const step3Opacity = useTransform(smoothProgress, [0.66, 0.76, 1], [0, 1, 1]);

  const step1Y = useTransform(smoothProgress, [0, 0.28, 0.35], [0, 0, -18]);
  const step2Y = useTransform(smoothProgress, [0.32, 0.42, 0.62, 0.68], [18, 0, 0, -18]);
  const step3Y = useTransform(smoothProgress, [0.66, 0.76, 1], [18, 0, 0]);

  // Indicator Bar Progress (0% to 100%)
  const barWidth = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onBookCommission();
  };

  return (
    <div ref={containerRef} className="relative h-[140vh] bg-chalk border-t-2 border-pomelo pb-0 mb-0 pt-6">
      
      {/* Sticky Viewport Stage */}
      <div className="sticky top-[7.5rem] sm:top-[8.5rem] lg:top-[7.5rem] flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
        
        {/* Main Split Card [ Text | Pic ] */}
        <div className="w-full max-w-6xl bg-pomelo/25 border-2 border-pomelo/70 rounded-3xl p-5 sm:p-7 lg:p-8 shadow-md relative overflow-hidden">
          
          {/* Top Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-pomelo/30 overflow-hidden z-10">
            <motion.div style={{ width: barWidth }} className="h-full bg-amaranth" />
          </div>

          {/* Grid Layout [ Text Left | Pic Right ] */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: Dynamic Scrolling Text */}
            <div className="lg:col-span-6 relative min-h-[290px] sm:min-h-[300px] flex flex-col justify-center space-y-3">
              
              {/* STEP 1 TEXT */}
              <motion.div
                style={{ opacity: step1Opacity, y: step1Y }}
                className="absolute inset-0 flex flex-col justify-center space-y-3.5 pointer-events-none"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amaranth bg-brook/70 px-3.5 py-1 rounded-full border border-pomelo/50 shadow-xs flex items-center gap-1.5 pointer-events-none">
                    <Sparkles className="w-3.5 h-3.5 text-amaranth" />
                    <span>01. BESPOKE CANVAS ARTWORK</span>
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-amaranth tracking-tight leading-[1.1] pointer-events-none">
                  Commission Your Custom Fine Art Piece
                </h2>
                <p className="text-xs sm:text-sm text-[#3D262A] leading-relaxed font-medium pointer-events-none">
                  Every commission is a collaborative dialogue between collector and artist. Share your spatial requirements, color palette, and emotional themes to bring an original canvas to life.
                </p>
              </motion.div>

              {/* STEP 2 TEXT */}
              <motion.div
                style={{ opacity: step2Opacity, y: step2Y }}
                className="absolute inset-0 flex flex-col justify-center space-y-3.5 pointer-events-none"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amaranth bg-brook/70 px-3.5 py-1 rounded-full border border-pomelo/50 shadow-xs flex items-center gap-1.5 pointer-events-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amaranth" />
                    <span>02. TAILORED SPATIAL HARMONY</span>
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-amaranth tracking-tight leading-[1.1] pointer-events-none">
                  Custom Canvas & Palette Harmonization
                </h2>
                <p className="text-xs sm:text-sm text-[#3D262A] leading-relaxed font-medium pointer-events-none">
                  From vibrant acrylic florals to serene minimalist compositions, every artwork is individually dimensioned and color-matched to anchor your home, gallery, or private residence.
                </p>
              </motion.div>

              {/* STEP 3 TEXT */}
              <motion.div
                style={{ opacity: step3Opacity, y: step3Y }}
                className="absolute inset-0 flex flex-col justify-center space-y-3.5 pointer-events-none"
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1 rounded-full border shadow-xs flex items-center gap-1.5 pointer-events-none ${
                    commissionsOpen ? 'bg-thulian/30 text-amaranth border-thulian/60' : 'bg-thulian text-chalk border-amaranth'
                  }`}>
                    {commissionsOpen ? <Sparkles className="w-3.5 h-3.5 text-amaranth" /> : <Lock className="w-3.5 h-3.5 text-chalk" />}
                    <span>{commissionsOpen ? '03. LIMITED SEASONAL AVAILABILITY' : '03. COMMISSIONS CURRENTLY CLOSED'}</span>
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-amaranth tracking-tight leading-[1.1] pointer-events-none">
                  {commissionsOpen ? 'Reserve Your Studio Commission Slot' : 'Join Upcoming Season Waitlist'}
                </h2>
                <p className="text-xs sm:text-sm text-[#3D262A] leading-relaxed font-medium pointer-events-none">
                  {commissionsOpen
                    ? "Due to the intricate nature of Rohma's process, only a limited number of commissions are accepted each season. Reserve your consultation to secure your placement."
                    : "Studio commission bookings are currently closed for the season. Submit your inquiry to join the priority waitlist for the next release."
                  }
                </p>

                {/* CTA Button — Reserve Your Spot only */}
                <div className="pt-1 flex flex-wrap items-center gap-3 pointer-events-auto">
                  <button
                    type="button"
                    onClick={handleButtonClick}
                    className="inline-flex items-center space-x-2 text-xs font-bold tracking-widest uppercase bg-amaranth text-chalk px-5 py-3 rounded-xl hover:bg-thulian transition-all shadow-md border border-amaranth hover:scale-105 pointer-events-auto cursor-pointer relative z-30"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>{commissionsOpen ? 'RESERVE YOUR SPOT NOW' : 'JOIN PRIORITY WAITLIST'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: The Commission Artwork Image */}
            <div className="lg:col-span-6 relative w-full">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full rounded-2xl overflow-hidden border-2 border-pomelo/70 shadow-md group bg-brook/30">
                <img
                  src={imageUrl}
                  alt="Rohma Draws Commission Artwork"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Overlay Badge */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="text-[10px] font-bold tracking-widest text-chalk uppercase bg-amaranth/90 px-3 py-1.5 rounded-lg border border-pomelo/40 backdrop-blur-xs shadow-xs">
                    FINE ART COMMISSION • ROHMA DRAWS
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
