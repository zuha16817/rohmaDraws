import React from 'react';
import { motion } from 'framer-motion';

interface MeetTheArtistProps {
  commissionsOpen?: boolean;
}

export const MeetTheArtist: React.FC<MeetTheArtistProps> = ({ commissionsOpen = true }) => {
  const bannerText = commissionsOpen
    ? '★ COMMISSIONS CURRENTLY OPEN FOR BOOKINGS'
    : '★ COMMISSIONS CURRENTLY CLOSED';

  const statusItems = Array(8).fill(bannerText);

  return (
    <div className="bg-chalk min-h-[85vh] overflow-hidden">
      
      {/* Top Single Moving Marquee Banner (Contains strictly requested status string) */}
      <div className={`w-full overflow-hidden py-2 border-y border-pomelo/60 shadow-xs flex select-none transition-colors ${
        commissionsOpen ? 'bg-brook/90 text-amaranth' : 'bg-thulian/30 text-amaranth border-thulian/50'
      }`}>
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 35 }}
          className="flex whitespace-nowrap items-center space-x-10 text-xs sm:text-sm font-bold uppercase tracking-widest"
        >
          {statusItems.concat(statusItems).map((text, idx) => (
            <span key={idx} className="flex items-center space-x-3">
              <span className="text-amaranth">{text}</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        
        {/* Page Title in Amaranth */}
        <div className="text-left pt-2">
          <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight text-amaranth leading-[1.05]">
            Hi, I’m Rohma!
          </h1>
        </div>

        {/* Perfectly Balanced Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Studio Portrait Photo */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative aspect-[4/5] w-full bg-pomelo/20 overflow-hidden shadow-sm border-2 border-pomelo/60 rounded-2xl">
              <img
                src="/images/artist_portrait.jpg"
                alt="Rohma Draws Fine Artist"
                className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* Right Column: Perfectly Aligned Artist Bio Text */}
          <div className="lg:col-span-7 space-y-6 text-[#3D262A] text-base sm:text-lg font-normal leading-relaxed">
            
            {/* Sub-tagline Callout in Pomelo 20% Wash */}
            <p className="border-l-4 border-amaranth pl-5 font-serif text-xl sm:text-2xl text-amaranth italic font-medium bg-pomelo/20 p-5 rounded-r-xl border-y border-r border-pomelo/50 leading-snug shadow-xs">
              A Singapore-based artist creating art that reminds you to find beauty in the little things.
            </p>

            <p>
              For the longest time, art was a means of escape from the real world - I was fully immersed in the hours after midnight, forgetting my worries and responsibilities.
            </p>

            <p>
              In recent years, art has become my pair of rose-tinted glasses. The fish at the grocery store, the clutter at my table, dinner cooking on the stove - nothing is mundane to me anymore. Everything has beauty, holds meaning, and offers the possibility to connect with others. All through the act of noticing.
            </p>

            <p>
              Now, art grounds me, keeps me present, and has helped me build a life I never feel the need to escape from.
            </p>

            <p className="font-semibold text-amaranth text-lg pt-1">
              Join me on my journey of making the ordinary extraordinary, and noticing all the little things so you too can look around the world in wonder and amazement, and never lose your whimsy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
