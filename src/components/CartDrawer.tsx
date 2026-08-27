import React from 'react';
import { X, Trash2, ArrowRight, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
    subtotal,
    totalWeightKg,
    isDigitalOnly
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-text-primary/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-chalk text-text-primary shadow-2xl flex flex-col border-l-2 border-pomelo">
          
          {/* Header */}
          <div className="p-6 border-b border-pomelo/30 flex items-center justify-between bg-brook/30">
            <div className="flex items-center space-x-2">
              <h2 className="font-serif text-xl font-bold text-amaranth">Your Collection Bag</h2>
              <span className="text-xs text-pomelo font-bold">({cart.length} items)</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-pomelo hover:text-amaranth transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="text-sm text-pomelo font-serif italic font-medium">
                  Your cart is currently empty.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-amaranth text-chalk text-xs font-bold uppercase tracking-wider hover:bg-thulian transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex space-x-4 pb-6 border-b border-pomelo/30 items-start"
                >
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-20 h-20 object-cover bg-brook/40 border border-pomelo rounded-xs"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif text-sm font-bold text-amaranth">{product.title}</h3>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-pomelo hover:text-amaranth transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-text-primary/70 font-medium">
                      {product.type === 'original'
                        ? 'Original Artwork (1 of 1)'
                        : product.type === 'digital'
                        ? 'Instant Digital Download'
                        : 'Fine Art Print'}
                    </p>

                    <div className="flex justify-between items-center pt-2">
                      {/* Quantity Selector */}
                      {product.type === 'original' ? (
                        <span className="text-[11px] font-bold text-amaranth px-2.5 py-0.5 bg-brook rounded border border-pomelo/30">
                          Unique Edition (1)
                        </span>
                      ) : (
                        <div className="flex items-center border border-pomelo rounded text-xs bg-chalk">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="px-2 py-0.5 hover:bg-brook/50 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono font-bold">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="px-2 py-0.5 hover:bg-brook/50 font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}

                      <span className="font-bold text-sm text-amaranth font-mono">
                        ${(product.price * quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Summary */}
          {cart.length > 0 && (
            <div className="p-6 border-t-2 border-pomelo/40 bg-brook/30 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-baseline font-serif text-lg text-amaranth font-bold">
                <span>Subtotal</span>
                <span className="font-sans text-2xl">${subtotal.toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onCheckout();
                }}
                className="w-full py-3.5 bg-amaranth text-chalk text-xs font-bold tracking-widest uppercase hover:bg-thulian transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
