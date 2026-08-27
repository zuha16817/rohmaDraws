import React, { useState } from 'react';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string, shopCategoryFilter?: string) => void;
  isAdminView: boolean;
  setIsAdminView: (val: boolean) => void;
  commissionsOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdminView,
  setIsAdminView,
  commissionsOpen = true
}) => {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-chalk shadow-sm border-b-2 border-pomelo transition-all duration-300">
      
      {/* Header Announcement Banner Strip */}
      <div className={`px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase flex items-center justify-center space-x-3 transition-colors ${
        commissionsOpen ? 'bg-pomelo text-chalk' : 'bg-thulian/30 text-amaranth border-b border-thulian/40'
      }`}>
        <span className={`w-2 h-2 rounded-full inline-block ${commissionsOpen ? 'bg-brook animate-pulse' : 'bg-thulian'}`} />
        <span className="flex items-center gap-2 text-center">
          {commissionsOpen ? '★ COMMISSIONS CURRENTLY OPEN FOR BOOKINGS' : '★ COMMISSIONS CURRENTLY CLOSED'}
        </span>
        <span className={`w-2 h-2 rounded-full inline-block ${commissionsOpen ? 'bg-thulian' : 'bg-pomelo'}`} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('home');
          }}
          className="flex items-center text-left group focus:outline-none cursor-pointer"
        >
          <div>
            <span
              className="font-jakarta text-2xl sm:text-3xl lg:text-4xl tracking-wider uppercase text-amaranth font-extrabold block leading-none group-hover:text-thulian transition-colors"
              style={{
                textShadow: '0 2px 4px rgba(255, 255, 255, 0.95), 0 0 2px #ffffff'
              }}
            >
              ROHMA DRAWS
            </span>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-3 text-xs tracking-widest uppercase font-bold">
          
          {/* 1. HOME */}
          <button
            onClick={() => {
              setIsAdminView(false);
              setActiveTab('home');
            }}
            className={`transition-all py-2 px-4 rounded-full font-bold shadow-xs border cursor-pointer ${
              activeTab === 'home' && !isAdminView
                ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                : 'bg-brook/40 text-text-primary border-pomelo/30 hover:bg-thulian hover:text-chalk hover:border-thulian'
            }`}
          >
            HOME
          </button>

          {/* 2. MEET THE ARTIST */}
          <button
            onClick={() => {
              setIsAdminView(false);
              setActiveTab('artist');
            }}
            className={`transition-all py-2 px-4 rounded-full font-bold shadow-xs border cursor-pointer ${
              activeTab === 'artist' && !isAdminView
                ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                : 'bg-brook/40 text-text-primary border-pomelo/30 hover:bg-thulian hover:text-chalk hover:border-thulian'
            }`}
          >
            MEET THE ARTIST
          </button>

          {/* 3. SHOP */}
          <div
            className="relative"
            onMouseEnter={() => setShowShopDropdown(true)}
            onMouseLeave={() => setShowShopDropdown(false)}
          >
            <button
              onClick={() => {
                setIsAdminView(false);
                setActiveTab('shop', 'all');
              }}
              className={`transition-all py-2 px-4 rounded-full font-bold shadow-xs border inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'shop' && !isAdminView
                  ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                  : 'bg-brook/40 text-text-primary border-pomelo/30 hover:bg-thulian hover:text-chalk hover:border-thulian'
              }`}
            >
              <span>SHOP</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Shop Dropdown Sub-menu */}
            {showShopDropdown && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-chalk border-2 border-pomelo rounded-xl shadow-xl p-2 z-50 space-y-1 text-[11px] uppercase font-bold tracking-wider">
                <button
                  onClick={() => {
                    setIsAdminView(false);
                    setActiveTab('shop', 'original');
                    setShowShopDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-amaranth hover:text-chalk transition-colors flex justify-between items-center text-text-primary cursor-pointer"
                >
                  <span>• Originals</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => {
                    setIsAdminView(false);
                    setActiveTab('shop', 'prints_digital');
                    setShowShopDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-amaranth hover:text-chalk transition-colors flex justify-between items-center text-text-primary cursor-pointer"
                >
                  <span>• Prints / Digital Copies</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => {
                    setIsAdminView(false);
                    setActiveTab('shop', 'all');
                    setShowShopDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-brook/40 text-amaranth border-t border-pomelo/30 pt-2 transition-colors cursor-pointer"
                >
                  View All Archive
                </button>
              </div>
            )}
          </div>

          {/* 4. COMMISSIONS */}
          <button
            onClick={() => {
              setIsAdminView(false);
              setActiveTab('commission');
            }}
            className={`transition-all py-2 px-4 rounded-full font-bold shadow-xs border relative cursor-pointer ${
              activeTab === 'commission' && !isAdminView
                ? 'bg-amaranth text-chalk border-amaranth shadow-sm'
                : 'bg-brook/40 text-text-primary border-pomelo/30 hover:bg-thulian hover:text-chalk hover:border-thulian'
            }`}
          >
            <span>COMMISSIONS</span>
            {!commissionsOpen && (
              <span className="ml-1.5 text-[9px] bg-thulian text-chalk px-1.5 py-0.5 rounded-full uppercase font-bold">
                Closed
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-brook/40 text-amaranth border border-pomelo/40 hover:bg-thulian hover:text-chalk rounded-full transition-all shadow-xs focus:outline-none cursor-pointer"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amaranth text-chalk text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-chalk shadow-xs">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Links Bar */}
      <div className="md:hidden flex justify-around py-2.5 px-2 bg-chalk border-t border-pomelo/30 text-[11px] font-bold tracking-wider uppercase">
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('home');
          }}
          className={`px-3 py-1 rounded-full ${activeTab === 'home' && !isAdminView ? 'bg-amaranth text-chalk' : 'text-text-primary'}`}
        >
          HOME
        </button>
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('artist');
          }}
          className={`px-3 py-1 rounded-full ${activeTab === 'artist' && !isAdminView ? 'bg-amaranth text-chalk' : 'text-text-primary'}`}
        >
          ARTIST
        </button>
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('shop');
          }}
          className={`px-3 py-1 rounded-full ${activeTab === 'shop' && !isAdminView ? 'bg-amaranth text-chalk' : 'text-text-primary'}`}
        >
          SHOP
        </button>
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('commission');
          }}
          className={`px-3 py-1 rounded-full relative ${activeTab === 'commission' && !isAdminView ? 'bg-amaranth text-chalk' : 'text-text-primary'}`}
        >
          COMMISSIONS {!commissionsOpen && '(CLOSED)'}
        </button>
      </div>
    </header>
  );
};
