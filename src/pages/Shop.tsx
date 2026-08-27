import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ArtworkCard } from '../components/ArtworkCard';

interface ShopProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  initialCategoryFilter?: string;
}

export const Shop: React.FC<ShopProps> = ({ products, onSelectProduct, initialCategoryFilter }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'original' | 'prints_digital'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    if (initialCategoryFilter === 'original') {
      setActiveCategory('original');
    } else if (initialCategoryFilter === 'prints_digital' || initialCategoryFilter === 'print' || initialCategoryFilter === 'digital') {
      setActiveCategory('prints_digital');
    } else if (initialCategoryFilter === 'all') {
      setActiveCategory('all');
    }
  }, [initialCategoryFilter]);

  const filteredProducts = products.filter((p) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'original') return p.type === 'original';
    if (activeCategory === 'prints_digital') return p.type === 'print' || p.type === 'digital';
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return b.id - a.id;
  });

  const displayedProducts = sortedProducts.slice(0, visibleCount);

  // Dynamic Header Title & Badge depending on selected category
  const getHeaderDetails = () => {
    switch (activeCategory) {
      case 'original':
        return {
          badge: 'ORIGINAL PAINTINGS',
          title: 'Original Artworks'
        };
      case 'prints_digital':
        return {
          badge: 'PRINTS & DIGITAL ARCHIVE',
          title: 'Prints / Digital Copies'
        };
      default:
        return {
          badge: 'GALLERY ARCHIVE',
          title: 'Curated Fine Art Collection'
        };
    }
  };

  const headerInfo = getHeaderDetails();

  return (
    <div className="bg-chalk py-12 px-4 sm:px-6 lg:px-8 min-h-[85vh]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Dynamic Header Banner with 25% Opacity Pomelo Olive Wash */}
        <div className="bg-pomelo/25 p-8 rounded-2xl border-2 border-pomelo/60 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <span className="text-xs tracking-widest font-bold uppercase text-amaranth bg-brook/60 px-3 py-1 rounded border border-pomelo/40">
              {headerInfo.badge}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl text-amaranth font-bold mt-2 transition-all">
              {headerInfo.title}
            </h1>
          </div>
          <div className="mt-4 md:mt-0 font-mono text-xs font-bold text-amaranth bg-brook/60 px-4 py-2 rounded-lg border border-pomelo/40 shadow-xs">
            Displaying {displayedProducts.length} of {sortedProducts.length} Artworks
          </div>
        </div>

        {/* Main Shop Grid & Sidebar Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Sidebar Filters with 25% Opacity Pomelo Olive Wash */}
          <aside className="md:col-span-3 space-y-8 bg-pomelo/25 p-6 rounded-2xl border-2 border-pomelo/60 shadow-xs">
            
            {/* Categories */}
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-amaranth border-b border-pomelo/40 pb-2">
                Categories
              </h2>
              <ul className="space-y-2.5 text-xs font-bold uppercase tracking-wider">
                {[
                  { id: 'all', label: 'All Archive' },
                  { id: 'original', label: 'Originals' },
                  { id: 'prints_digital', label: 'Prints / Digital Copies' }
                ].map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setActiveCategory(cat.id as any);
                        setVisibleCount(6);
                      }}
                      className={`transition-all flex items-center justify-between w-full text-left py-2.5 px-3.5 rounded-lg border ${
                        activeCategory === cat.id
                          ? 'bg-amaranth text-chalk font-bold shadow-xs border-amaranth'
                          : 'bg-pomelo/20 text-[#212121] border-pomelo/40 hover:bg-thulian hover:text-chalk'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {activeCategory === cat.id && <span>→</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sort By */}
            <div className="space-y-3 pt-6 border-t border-pomelo/40">
              <h3 className="text-xs tracking-widest font-bold uppercase text-[#3D262A]/70 border-b border-pomelo/20 pb-1">
                SORT BY
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-pomelo/20 border border-pomelo/60 text-xs text-[#212121] font-bold py-2.5 px-3 focus:outline-none focus:border-amaranth cursor-pointer rounded-lg shadow-xs"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="md:col-span-9 space-y-12">
            {displayedProducts.length === 0 ? (
              <div className="text-center py-20 bg-pomelo/25 rounded-2xl p-8 border-2 border-pomelo/60 shadow-xs">
                <p className="font-serif text-xl text-amaranth font-bold">
                  No artworks found in this category.
                </p>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="mt-4 px-6 py-3 bg-amaranth text-chalk text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-thulian transition-colors shadow-xs"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedProducts.map((product) => (
                  <ArtworkCard
                    key={product.id}
                    product={product}
                    onSelect={onSelectProduct}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < sortedProducts.length && (
              <div className="text-center pt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-10 py-3.5 bg-brook/50 text-amaranth border-2 border-pomelo text-xs font-bold tracking-widest uppercase hover:bg-amaranth hover:text-chalk transition-all shadow-xs rounded-xl"
                >
                  Load More Artwork
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
