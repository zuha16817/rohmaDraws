import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { MeetTheArtist } from './pages/MeetTheArtist';
import { Commissions } from './pages/Commissions';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { Admin } from './pages/Admin';
import { Product } from './types';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCommissionRequests, updateCommissionStatus, deleteCommissionRequest, fetchOrders, updateOrderStatus, deleteOrder, submitOrder, fetchStudioSettings, updateStudioSettings } from './services/api';
import { INITIAL_PRODUCTS } from './data/mockData';

const LOCAL_STORAGE_KEY = 'rohma_draws_published_products';
const COMMISSION_IMG_STORAGE_KEY = 'rohma_draws_commission_card_image_v2';
const COMMISSIONS_OPEN_STORAGE_KEY = 'rohma_draws_commissions_open';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [shopCategoryFilter, setShopCategoryFilter] = useState<string>('all');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminPasswordError, setAdminPasswordError] = useState<boolean>(false);

  // Detect /admin URL and show password gate
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setShowAdminLogin(true);
    }
  }, []);

  const handleAdminLogin = () => {
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin_secret_pass';
    if (adminPassword === validPassword) {
      setAdminAuthenticated(true);
      setIsAdminView(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      setAdminPasswordError(false);
      window.history.replaceState(null, '', '/');
    } else {
      setAdminPasswordError(true);
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminView(false);
    setAdminAuthenticated(false);
  };
  
  // Initialize products from LocalStorage for instant browser persistence across reloads
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Graceful fallback if storage read fails
    }
    return INITIAL_PRODUCTS;
  });

  // Commissions Homepage Showcase Picture State
  const [commissionCardImage, setCommissionCardImage] = useState<string>(() => {
    try {
      const savedImg = localStorage.getItem(COMMISSION_IMG_STORAGE_KEY);
      if (savedImg) return savedImg;
    } catch {
      // Fallback
    }
    return '/images/Pink Lillies.jpg';
  });

  // Studio Commissions Booking Status (Open vs Closed) State
  const [commissionsOpen, setCommissionsOpen] = useState<boolean>(() => {
    try {
      const savedStatus = localStorage.getItem(COMMISSIONS_OPEN_STORAGE_KEY);
      if (savedStatus !== null) return JSON.parse(savedStatus);
    } catch {
      // Fallback
    }
    return true; // Default Open
  });

  // Live Commission Requests State
  const [commissionRequests, setCommissionRequests] = useState<any[]>([]);

  // Live Orders State (from MySQL database)
  const [orders, setOrders] = useState<any[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [completedOrderInfo, setCompletedOrderInfo] = useState<any>(null);

  // Detect return from Stripe Hosted Checkout with ?status=success
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('status') === 'success') {
      const sessionId = query.get('session_id') || '';
      const orderRef = query.get('order_ref') || ('RD-STRIPE-' + (sessionId ? sessionId.substring(0, 10).toUpperCase() : 'LIVE'));

      // Read locally saved pending checkout order details
      let pendingOrder: any = null;
      try {
        const savedOrder = localStorage.getItem('pending_stripe_order');
        if (savedOrder) {
          pendingOrder = JSON.parse(savedOrder);
        }
      } catch (err) {
        console.error(err);
      }

      let items: any[] = [];
      try {
        const savedItems = localStorage.getItem('pending_stripe_items');
        if (savedItems) {
          items = JSON.parse(savedItems);
        }
      } catch (err) {
        console.error(err);
      }

      const orderSummary = {
        order_number: pendingOrder?.order_number || orderRef,
        customer_name: pendingOrder?.customer_name || 'Valued Collector',
        customer_email: pendingOrder?.customer_email || 'Valued Collector',
        shipping_country: pendingOrder?.shipping_country || 'SG',
        shipping_address: pendingOrder?.shipping_address || 'Standard Delivery',
        items: pendingOrder?.items || items,
        has_digital_items: true,
        message: 'Your acquisition was successfully completed via Stripe Live Checkout.'
      };
      setCompletedOrderInfo(orderSummary);
      setActiveTab('order_success');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Save / update order in MySQL database as PAID
      if (pendingOrder) {
        submitOrder({
          order_number: pendingOrder.order_number || orderRef,
          customer_name: pendingOrder.customer_name || 'Valued Collector',
          customer_email: pendingOrder.customer_email,
          shipping_country: pendingOrder.shipping_country || 'SG',
          shipping_address: pendingOrder.shipping_address || 'Standard Delivery',
          payment_method: 'stripe_hosted',
          payment_status: 'paid',
          status: 'paid',
          total_amount: pendingOrder.items ? pendingOrder.items.reduce((s: number, i: any) => s + ((i.price || 0) * (i.quantity || 1)), 0) + (pendingOrder.shipping_cost || 0) : 0,
          shipping_cost: pendingOrder.shipping_cost || 0,
          items: pendingOrder.items || items
        }).then(() => loadOrders());
      }

      // Query Stripe API directly if sessionId is present to fetch exact customer email & details
      if (sessionId && sessionId.startsWith('cs_')) {
        const LIVE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || '';
        fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=line_items`, {
          headers: {
            'Authorization': `Bearer ${LIVE_SECRET_KEY}`
          }
        })
        .then(res => res.json())
        .then(sessionData => {
          if (sessionData && sessionData.customer_details) {
            const email = sessionData.customer_details.email || sessionData.customer_email;
            const name = sessionData.customer_details.name;
            if (email) {
              setCompletedOrderInfo((prev: any) => ({
                ...prev,
                customer_email: email,
                customer_name: name || prev?.customer_name
              }));
            }
          }
        })
        .catch(err => console.error('Error fetching Stripe session:', err));
      }
    }
  }, []);

  function strtoupper(str: string): string {
    return str.toUpperCase();
  }

  // Safe sync to LocalStorage with try/catch to prevent QuotaExceededError crashes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
    } catch (err) {
      console.warn('LocalStorage quota limit reached; artwork held in active session memory.', err);
    }
  }, [products]);

  // Sync Commission Card Image to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMMISSION_IMG_STORAGE_KEY, commissionCardImage);
    } catch (err) {
      console.warn('LocalStorage error storing commission image.', err);
    }
  }, [commissionCardImage]);

  // Sync Commissions Open Status to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMMISSIONS_OPEN_STORAGE_KEY, JSON.stringify(commissionsOpen));
    } catch (err) {
      console.warn('LocalStorage error storing commissions status.', err);
    }
  }, [commissionsOpen]);

  // Fetch live products from MySQL database API on load
  const loadProducts = () => {
    fetchProducts().then((data) => {
      if (data && data.length > 0) {
        setProducts(data);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch {}
      }
    });
  };

  // Fetch live global studio settings (Commissions status, Showcase image, Shipping rates)
  const loadStudioSettings = () => {
    fetchStudioSettings().then((settings) => {
      if (settings) {
        if (settings.commissions_open !== undefined) {
          setCommissionsOpen(settings.commissions_open);
          try {
            localStorage.setItem(COMMISSIONS_OPEN_STORAGE_KEY, JSON.stringify(settings.commissions_open));
          } catch {}
        }
        if (settings.commission_card_image) {
          setCommissionCardImage(settings.commission_card_image);
          try {
            localStorage.setItem(COMMISSION_IMG_STORAGE_KEY, settings.commission_card_image);
          } catch {}
        }
      }
    });
  };

  // Fetch live commission requests from MySQL database API on load
  const loadCommissions = () => {
    fetchCommissionRequests().then((data) => {
      if (Array.isArray(data)) {
        setCommissionRequests(data);
      }
    });
  };

  // Fetch live orders from MySQL database API on load
  const loadOrders = () => {
    fetchOrders().then((data) => {
      if (Array.isArray(data)) {
        setOrders(data);
      }
    });
  };

  useEffect(() => {
    loadProducts();
    loadStudioSettings();
    loadCommissions();
    loadOrders();
  }, []);

  const handleToggleCommissionsOpen = (val: boolean) => {
    setCommissionsOpen(val);
    updateStudioSettings({ commissions_open: val });
  };

  const handleUpdateCommissionImage = (imgUrl: string) => {
    setCommissionCardImage(imgUrl);
    updateStudioSettings({ commission_card_image: imgUrl });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('product_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    updateProduct(updated.id, updated).then(() => {
      loadProducts();
    });
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    deleteProduct(productId).then(() => {
      loadProducts();
    });
  };

  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    createProduct(newProd).then(() => {
      loadProducts();
    });
  };

  const handleUpdateCommissionStatus = (id: number, status: string) => {
    setCommissionRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    updateCommissionStatus(id, status);
  };

  const handleDeleteCommissionRequest = (id: number) => {
    setCommissionRequests((prev) => prev.filter((r) => r.id !== id));
    deleteCommissionRequest(id);
  };

  const handleUpdateOrderStatus = (id: number, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    updateOrderStatus(id, status);
  };

  const handleDeleteOrder = (id: number) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    deleteOrder(id);
  };

  const handleNavigateTab = (tab: string, categoryFilter?: string) => {
    setIsAdminView(false);
    setActiveTab(tab);
    if (categoryFilter) {
      setShopCategoryFilter(categoryFilter);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-primary selection:bg-accent-primary selection:text-white">

      {/* Admin Password Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-chalk border-2 border-pomelo rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🔐</div>
              <h2 className="font-jakarta text-xl font-extrabold text-amaranth uppercase tracking-widest">Admin Portal</h2>
              <p className="text-xs text-pomelo mt-1 tracking-wide">Enter your password to continue</p>
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminPasswordError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Password"
              autoFocus
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-sm font-medium outline-none transition-colors mb-3 ${
                adminPasswordError ? 'border-amaranth text-amaranth placeholder-amaranth/50' : 'border-pomelo/50 focus:border-pomelo text-text-primary'
              }`}
            />
            {adminPasswordError && (
              <p className="text-amaranth text-xs font-bold text-center mb-3">Incorrect password. Try again.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdminLogin(false); setAdminPassword(''); setAdminPasswordError(false); window.history.replaceState(null, '', '/'); }}
                className="flex-1 py-2.5 rounded-xl border-2 border-pomelo/40 text-pomelo text-sm font-bold hover:bg-pomelo/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminLogin}
                className="flex-1 py-2.5 rounded-xl bg-amaranth text-chalk text-sm font-bold hover:bg-thulian transition-colors cursor-pointer"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        isAdminView={isAdminView}
        setIsAdminView={(val) => {
          if (!val) handleAdminLogout();
        }}
        commissionsOpen={commissionsOpen}
      />

      {/* Cart Drawer */}
      <CartDrawer onCheckout={() => handleNavigateTab('checkout')} />

      {/* Main Page Router */}
      <main className="flex-1">
        {isAdminView && adminAuthenticated ? (
          <Admin
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={handleAddProduct}
            commissionCardImage={commissionCardImage}
            onUpdateCommissionImage={handleUpdateCommissionImage}
            commissionsOpen={commissionsOpen}
            onToggleCommissionsOpen={handleToggleCommissionsOpen}
            commissionRequests={commissionRequests}
            onRefreshCommissions={loadCommissions}
            onUpdateCommissionStatus={handleUpdateCommissionStatus}
            onDeleteCommissionRequest={handleDeleteCommissionRequest}
            orders={orders}
            onRefreshOrders={loadOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <Home
                products={products}
                onSelectProduct={handleSelectProduct}
                setActiveTab={handleNavigateTab}
                commissionCardImage={commissionCardImage}
                commissionsOpen={commissionsOpen}
              />
            )}
            {activeTab === 'shop' && (
              <Shop
                products={products}
                onSelectProduct={handleSelectProduct}
                initialCategoryFilter={shopCategoryFilter}
              />
            )}
            {activeTab === 'artist' && <MeetTheArtist commissionsOpen={commissionsOpen} />}
            {activeTab === 'commission' && <Commissions commissionsOpen={commissionsOpen} onCommissionSubmitted={loadCommissions} />}
            {activeTab === 'product_detail' && selectedProduct && (
              <ProductDetail
                product={selectedProduct}
                onBack={() => handleNavigateTab('shop')}
              />
            )}
            {activeTab === 'checkout' && (
              <Checkout
                onBackToShop={() => handleNavigateTab('shop')}
                onSuccessOrder={(info) => {
                  setCompletedOrderInfo(info);
                  setActiveTab('order_success');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {activeTab === 'order_success' && (
              <OrderSuccess
                orderInfo={completedOrderInfo}
                onReturnHome={() => handleNavigateTab('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={handleNavigateTab} />
    </div>
  );
};

export function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
