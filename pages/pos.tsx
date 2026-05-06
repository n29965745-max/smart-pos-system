import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DateRangeFilter from '../components/DateRangeFilter';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import Pagination from '../components/Pagination';
import ReceiptPrint from '../components/ReceiptPrint';

interface Product {
  id: string;
  name: string;
  sku: string;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  image_url?: string;
}

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  price_type: string;
  subtotal: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  debt_limit: number;
}

interface CustomerCredit {
  customerId: string;
  customerName: string;
  debtLimit: number;
  currentDebt: number;
  availableCredit: number;
  hasCredit: boolean;
}

export default function POSPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMode, setPriceMode] = useState<'retail' | 'wholesale' | 'all'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Toast notification
  const { toast, showToast, hideToast } = useToast();
  
  // Local state for quantity inputs (allows empty string for editing)
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

  // Checkout form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Customer selection for debt payment
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerCredit, setCustomerCredit] = useState<CustomerCredit | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchCart();
    fetchCustomers();
    fetchShopSettings();
    fetchCurrentUser();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (searchQuery) {
      searchProducts();
    } else {
      fetchProducts();
    }
  }, [searchQuery]);

  // Barcode Scanner Integration
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout: NodeJS.Timeout;

    const handleKeyPress = async (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ignore if checkout modal is open
      if (showCheckout) {
        return;
      }

      // Clear timeout on each keypress
      clearTimeout(barcodeTimeout);

      // Enter key means barcode scan is complete
      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        e.preventDefault();
        await handleBarcodeScanned(barcodeBuffer.trim());
        barcodeBuffer = '';
        return;
      }

      // Add character to buffer (barcode scanners type very fast)
      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        
        // Auto-clear buffer after 100ms of no input (human typing is slower)
        barcodeTimeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 100);
      }
    };

    // Add event listener
    window.addEventListener('keypress', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, [showCheckout, priceMode, products]);

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Search for product by SKU (barcode)
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(barcode)}`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        // Find exact SKU match
        const product = data.products.find((p: Product) => p.sku.toLowerCase() === barcode.toLowerCase());
        
        if (product) {
          // Check stock
          if (product.stock_quantity <= 0) {
            showToast(`${product.name} is out of stock!`, 'error');
            return;
          }

          // Add to cart with appropriate price
          const priceType = priceMode === 'all' ? 'retail' : priceMode;
          await addToCart(product, priceType as 'retail' | 'wholesale');
          
          // Show success feedback
          showToast(`✓ ${product.name} added to cart`, 'success');
        } else {
          showToast(`Product not found: ${barcode}`, 'error');
        }
      } else {
        showToast(`Product not found: ${barcode}`, 'error');
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      showToast('Error scanning barcode', 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/products/list?${params}`);
      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalProducts(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers/list?limit=1000');
      const data = await response.json();
      setCustomersList(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchShopSettings = async () => {
    try {
      const response = await fetch('/api/shop-settings');
      const data = await response.json();
      if (response.ok && data.settings) {
        setShopSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching shop settings:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchCustomerCredit = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/credit?customerId=${customerId}`);
      const data = await response.json();
      if (response.ok) {
        setCustomerCredit(data);
      } else {
        setCustomerCredit(null);
      }
    } catch (error) {
      console.error('Error fetching customer credit:', error);
      setCustomerCredit(null);
    }
  };

  const searchProducts = async () => {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/pos/cart?sessionId=${sessionId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch cart:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('Cart fetched:', data); // Debug log
      
      setCart(data.items || []);
      setCartTotal(data.total || 0);
      
      // Initialize quantity inputs with current cart quantities
      const inputs: Record<string, string> = {};
      (data.items || []).forEach((item: CartItem) => {
        inputs[item.id] = item.quantity.toString();
      });
      setQuantityInputs(inputs);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (product: Product, selectedPriceType?: 'retail' | 'wholesale') => {
    // Check stock first
    if (product.stock_quantity <= 0) {
      showToast(`${product.name} is out of stock!`, 'error');
      return;
    }

    // If priceMode is 'all', use the selectedPriceType, otherwise use priceMode
    const priceType = selectedPriceType || (priceMode === 'all' ? 'retail' : priceMode);
    const unitPrice = priceType === 'retail' ? product.retail_price : product.wholesale_price;
    
    // Show instant feedback
    showToast(`✓ ${product.name} added`, 'success');

    // Make API call and wait for response
    try {
      const response = await fetch('/api/pos/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice,
          priceType
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update cart from server response
        await fetchCart();
      } else {
        console.error('Cart API error:', data);
        showToast(`Error: ${data.error || 'Failed to add to cart'}`, 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add to cart', 'error');
    }
  };

  const updateCartQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch('/api/pos/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity: newQuantity })
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`/api/pos/cart?id=${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch(`/api/pos/cart?sessionId=${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    // Validate payment based on method
    if (paymentMethod === 'debt') {
      if (!selectedCustomer) {
        showToast('Please select a customer for debt payment', 'error');
        return;
      }
      if (!customerCredit || !customerCredit.hasCredit) {
        showToast('Selected customer does not have credit limit', 'error');
        return;
      }
      if (cartTotal > customerCredit.availableCredit) {
        showToast(`Insufficient credit. Available: KSH ${customerCredit.availableCredit.toFixed(2)}`, 'error');
        return;
      }
    } else {
      const paid = parseFloat(amountPaid) || 0;
      if (paid < cartTotal) {
        showToast('Amount paid is less than total', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const paid = paymentMethod === 'debt' ? 0 : parseFloat(amountPaid);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          customerId: selectedCustomer?.id,
          customerName: selectedCustomer?.name || customerName || 'Walk-in Customer',
          customerPhone: selectedCustomer?.phone || customerPhone,
          subtotal: cartTotal,
          discount: 0,
          tax: 0,
          total: cartTotal,
          amountPaid: paid,
          paymentMethod,
          cashierName: currentUser?.full_name || currentUser?.name || currentUser?.username || 'Cashier'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Ensure shop settings and user data are loaded before showing receipt
        let finalShopSettings = shopSettings;
        let finalCurrentUser = currentUser;
        
        // If shop settings not loaded yet, fetch them now
        if (!finalShopSettings) {
          try {
            const settingsResponse = await fetch('/api/shop-settings');
            const settingsData = await settingsResponse.json();
            if (settingsResponse.ok && settingsData.settings) {
              finalShopSettings = settingsData.settings;
              setShopSettings(settingsData.settings);
            }
          } catch (error) {
            console.error('Error fetching shop settings for receipt:', error);
          }
        }
        
        // If user not loaded yet, fetch from localStorage
        if (!finalCurrentUser) {
          try {
            const user = localStorage.getItem('user');
            if (user) {
              finalCurrentUser = JSON.parse(user);
              setCurrentUser(finalCurrentUser);
            }
          } catch (error) {
            console.error('Error fetching user for receipt:', error);
          }
        }
        
        // Prepare receipt data with real shop settings
        const receipt = {
          transactionNumber: data.transaction?.transaction_number || 'N/A',
          date: new Date().toLocaleString('en-KE', { 
            timeZone: 'Africa/Nairobi',
            dateStyle: 'medium',
            timeStyle: 'short'
          }),
          customerName: selectedCustomer?.name || customerName || 'Walk-in Customer',
          customerPhone: selectedCustomer?.phone || customerPhone,
          items: cart,
          subtotal: cartTotal,
          discount: 0,
          tax: 0,
          total: cartTotal,
          amountPaid: paid,
          change: paid - cartTotal,
          paymentMethod,
          cashierName: finalCurrentUser?.full_name || finalCurrentUser?.name || finalCurrentUser?.username || 'Cashier',
          // Shop settings from database (using correct field names)
          shopName: finalShopSettings?.business_name || 'Smart POS',
          shopTagline: finalShopSettings?.business_tagline || '',
          shopLogo: finalShopSettings?.logo_url || '',
          shopAddress: finalShopSettings?.business_address || '',
          shopPhone: finalShopSettings?.business_phone || '',
          shopEmail: finalShopSettings?.business_email || ''
        };

        // Set receipt data and show immediately
        setReceiptData(receipt);
        setShowReceipt(true);
        
        // Clear loading state immediately
        setLoading(false);

        if (paymentMethod === 'debt') {
          showToast('Transaction completed on credit!', 'success');
        } else {
          showToast(`Transaction completed! Change: KSH ${(paid - cartTotal).toFixed(2)}`, 'success');
        }
        
        setShowCheckout(false);
        setCustomerName('');
        setCustomerPhone('');
        setAmountPaid('');
        setSelectedCustomer(null);
        setCustomerSearch('');
        setCustomerCredit(null);
        setPaymentMethod('cash');
        await fetchCart();
      } else {
        showToast(`Error: ${data.error}`, 'error');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      showToast('Checkout failed', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] pb-20">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="text"
              placeholder={`Search by name, SKU, or description... (${priceMode} mode)`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={priceMode}
              onChange={(e) => setPriceMode(e.target.value as 'retail' | 'wholesale' | 'all')}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)]"
            >
              <option value="all">All</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
            </select>
            
            {/* Barcode Scanner Indicator */}
            {!showCheckout && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="text-xs font-medium text-green-500">Scanner Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid - Full Width */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-3 hover:border-blue-500 transition-colors"
                >
                  {/* Stock Badge */}
                  <div className="text-xs text-[var(--text-secondary)] mb-2">
                    {product.stock_quantity} in stock
                  </div>

                  {/* Product Image Placeholder */}
                  <div className="w-full h-24 bg-[var(--bg-primary)] rounded-lg mb-2 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <svg className="w-10 h-10 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="mb-2">
                    <h3 className="font-semibold text-xs text-[var(--text-primary)] mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">SKU: {product.sku}</p>
                  </div>

                  {/* Price Display */}
                  <div className="mb-2">
                    {priceMode === 'all' ? (
                      // Show both prices when "All" is selected
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                            Retail
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            KSH {product.retail_price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                            Wholesale
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            KSH {product.wholesale_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Show selected price mode
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          {priceMode === 'retail' ? 'Retail' : 'Wholesale'}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          KSH {(priceMode === 'retail' ? product.retail_price : product.wholesale_price).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button - Icon Only or Split buttons for "All" mode */}
                  {priceMode === 'all' ? (
                    <div className="grid grid-cols-2 gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, 'retail');
                        }}
                        disabled={product.stock_quantity <= 0}
                        className="bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs">R</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, 'wholesale');
                        }}
                        disabled={product.stock_quantity <= 0}
                        className="bg-green-600 hover:bg-green-700 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs">W</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-all flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
        </div>
        
        {/* Pagination */}
        {totalProducts > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalProducts}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
              itemName="products"
            />
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setShowCheckout(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all z-40 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>

      {/* Cart/Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Cart & Checkout</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Cart Items</h3>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-500 hover:text-red-400"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-[var(--text-secondary)] py-8">Cart is empty</p>
                ) : (
                  cart.map((item, index) => {
                    // Find the product to get stock quantity
                    const product = products.find(p => p.id === item.product_id);
                    const maxStock = product?.stock_quantity || 0;
                    
                    return (
                      <div key={item.id} className="bg-[var(--bg-primary)] rounded-lg p-3 flex items-center gap-3">
                        {/* Product Icon */}
                        <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0">
                          {product?.image_url ? (
                            <img src={product.image_url} alt={item.product_name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                              {item.price_type}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{item.product_name}</h4>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-1">
                            <span>Unit: KSH {item.unit_price.toFixed(2)}</span>
                            <span className="text-[var(--text-primary)]">
                              {(quantityInputs[item.id] || item.quantity)} × KSH {item.unit_price.toFixed(0)}
                            </span>
                          </div>
                          
                          {/* Quantity Input */}
                          <div className="mt-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={quantityInputs[item.id] !== undefined ? quantityInputs[item.id] : item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string or numbers only
                                if (value === '' || /^\d+$/.test(value)) {
                                  setQuantityInputs(prev => ({ ...prev, [item.id]: value }));
                                  
                                  // Update cart if valid number
                                  if (value !== '' && !isNaN(parseInt(value))) {
                                    const newQty = parseInt(value);
                                    if (newQty >= 1 && newQty <= maxStock) {
                                      updateCartQuantity(item.id, newQty);
                                    }
                                  }
                                }
                              }}
                              onFocus={(e) => {
                                // Clear the field on focus so user can type fresh
                                setQuantityInputs(prev => ({ ...prev, [item.id]: '' }));
                              }}
                              onBlur={(e) => {
                                // If field is empty or invalid on blur, reset to 1
                                const value = e.target.value;
                                if (value === '' || parseInt(value) < 1) {
                                  setQuantityInputs(prev => ({ ...prev, [item.id]: '1' }));
                                  updateCartQuantity(item.id, 1);
                                } else {
                                  const newQty = parseInt(value);
                                  if (newQty > maxStock) {
                                    setQuantityInputs(prev => ({ ...prev, [item.id]: maxStock.toString() }));
                                    updateCartQuantity(item.id, maxStock);
                                  } else {
                                    // Ensure the display matches what was typed
                                    setQuantityInputs(prev => ({ ...prev, [item.id]: newQty.toString() }));
                                  }
                                }
                              }}
                              className="w-20 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded px-2 py-1 text-sm text-center"
                              placeholder="Qty"
                            />
                            <span className="text-xs text-[var(--text-secondary)] ml-2">Max: {maxStock}</span>
                          </div>
                        </div>

                        {/* Subtotal and Delete */}
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">KSH {item.subtotal.toFixed(2)}</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-400 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Cart Total */}
              <div className="border-t border-[var(--border-color)] pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Items:</span>
                  <span className="text-sm font-medium">{cart.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-emerald-500">KSH {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <div className="border-t border-[var(--border-color)] pt-4">
                <h3 className="font-semibold mb-4">Payment Details</h3>
                <div className="space-y-4 mb-6">
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Customer (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                          if (!e.target.value) {
                            setSelectedCustomer(null);
                            setCustomerCredit(null);
                          }
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                        placeholder="Search customer by name or phone..."
                      />
                      
                      {/* Customer Dropdown */}
                      {showCustomerDropdown && !selectedCustomer && (
                        <div className="absolute z-10 w-full mt-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {customersList
                            .filter(c => 
                              c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                              c.phone?.toLowerCase().includes(customerSearch.toLowerCase())
                            )
                            .slice(0, 10)
                            .map(customer => (
                              <button
                                key={customer.id}
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setCustomerSearch('');
                                  setShowCustomerDropdown(false);
                                  fetchCustomerCredit(customer.id);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--bg-primary)] text-sm"
                              >
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-xs text-[var(--text-secondary)]">{customer.phone}</div>
                              </button>
                            ))}
                          {customersList.filter(c => 
                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.phone?.toLowerCase().includes(customerSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">No customers found</div>
                          )}
                        </div>
                      )}
                      
                      {/* Selected Customer Info */}
                      {selectedCustomer && (
                        <div className="mt-2 p-2 bg-[var(--bg-primary)] rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium">{selectedCustomer.name}</div>
                              <div className="text-xs text-[var(--text-secondary)]">{selectedCustomer.phone}</div>
                              {customerCredit && customerCredit.hasCredit && (
                                <div className="text-xs text-emerald-500 mt-1">
                                  Credit Available: KSH {customerCredit.availableCredit.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedCustomer(null);
                                setCustomerCredit(null);
                                setCustomerSearch('');
                                if (paymentMethod === 'debt') {
                                  setPaymentMethod('cash');
                                }
                              }}
                              className="text-red-500 hover:text-red-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Walk-in Customer Fields (only show if no customer selected) */}
                  {!selectedCustomer && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Customer Name (Optional)</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                          placeholder="Walk-in Customer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number (Optional)</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                          placeholder="+254..."
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                      {selectedCustomer && customerCredit && customerCredit.hasCredit && (
                        <option value="debt">Debt (Credit)</option>
                      )}
                    </select>
                  </div>

                  {/* Amount Paid - Only show for non-debt payments */}
                  {paymentMethod !== 'debt' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Amount Paid *</label>
                      <input
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Payment Summary */}
                  <div className="bg-[var(--bg-primary)] rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Total:</span>
                      <span className="text-sm font-semibold">KSH {cartTotal.toFixed(2)}</span>
                    </div>
                    {paymentMethod === 'debt' ? (
                      <div className="flex justify-between">
                        <span className="text-sm">Payment:</span>
                        <span className="text-sm font-semibold text-amber-500">On Credit</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-sm">Change:</span>
                        <span className="text-sm font-semibold text-emerald-500">
                          KSH {Math.max(0, (parseFloat(amountPaid) || 0) - cartTotal).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={loading || (paymentMethod !== 'debt' && (!amountPaid || parseFloat(amountPaid) < cartTotal))}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold"
                  >
                    {loading ? 'Processing...' : 'Complete Sale'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Print Modal */}
      {showReceipt && receiptData && (
        <ReceiptPrint
          data={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
