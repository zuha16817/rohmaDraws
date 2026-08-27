import React from 'react';
import { Mail, Instagram } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-brook/60 text-[#3D262A] border-t-2 border-pomelo pt-10 pb-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-pomelo/40 items-start">
          
          {/* Brand Info Column */}
          <div className="md:col-span-6 space-y-2">
            <h3 className="font-serif text-2xl font-bold text-amaranth tracking-tight">
              ROHMA DRAWS
            </h3>
            <p className="text-xs text-[#3D262A]/90 max-w-sm leading-relaxed font-medium">
              Curated original fine art, limited edition archival prints, and custom commissions.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] tracking-widest font-bold uppercase text-pomelo border-b border-pomelo/40 pb-1">
              NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="hover:text-amaranth transition-colors text-[#3D262A]/90 hover:underline cursor-pointer"
                >
                  Archive Collection
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('commission')}
                  className="hover:text-amaranth transition-colors text-[#3D262A]/90 hover:underline cursor-pointer"
                >
                  Commissions Requests
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('artist')}
                  className="hover:text-amaranth transition-colors text-[#3D262A]/90 hover:underline cursor-pointer"
                >
                  Artist About
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Social Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] tracking-widest font-bold uppercase text-pomelo border-b border-pomelo/40 pb-1">
              DIRECT STUDIO CONTACT
            </h4>
            <div className="flex items-center space-x-2.5 text-chalk pt-1">
              <a
                href="https://www.instagram.com/rohmadraws/"
                target="_blank"
                rel="noopener noreferrer"
                title="Rohma Draws Instagram"
                aria-label="Instagram"
                className="p-2 bg-amaranth rounded-full hover:bg-thulian transition-transform hover:scale-110 shadow-xs"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:rkaramat03@gmail.com"
                title="Email Studio"
                aria-label="Email Studio"
                className="p-2 bg-amaranth rounded-full hover:bg-thulian transition-transform hover:scale-110 shadow-xs"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Copyright & Developer Credit */}
        <div className="pt-6 text-center text-[11px] tracking-wider text-[#3D262A]/80 font-bold">
          © 2026 Rohma Draws Studio. Developed by{' '}
          <a
            href="https://www.linkedin.com/in/zuha-o-0841591a2/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amaranth hover:underline transition-colors cursor-pointer"
          >
            Zuha Obaid
          </a>
        </div>
      </div>
    </footer>
  );
};
