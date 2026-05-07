import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import Pagination from '../components/Pagination';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  minimum_stock_level: number;
  variant_of: string | null;
  image_url: string | null;
  description: string | null;
  barcode: string | null;
  status: string;
  created_at: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterTab, setFilterTab] = useState<'all' | 'parent' | 'archived'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    costPrice: '',
    retailPrice: '',
    wholesalePrice: '',
    stockQuantity: '',
    minimumStockLevel: '10',
    description: '',
    barcode: '',
    imageUrl: ''
  });

  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockUnit, setRestockUnit] = useState('piece');
  const [restockStockType, setRestockStockType] = useState('Retail');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, filterTab, currentPage, itemsPerPage]);

  // Auto-generate SKU when Add Product modal opens or product name changes
  useEffect(() => {
    if (showAddModal && formData.name && !formData.sku) {
      generateSKU();
    }
  }, [showAddModal, formData.name]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        category: selectedCategory,
        filter: filterTab,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/inventory/list?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProducts(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedImageUrl = formData.imageUrl;

      // Upload image if file is selected
      if (imageFile && imagePreview) {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: imagePreview,
            filename: imageFile.name,
          }),
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedImageUrl = uploadData.url;
        } else {
          setToast({ message: 'Image upload failed, continuing without image', type: 'info' });
        }
      }

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          costPrice: parseFloat(formData.costPrice) || 0,
          retailPrice: parseFloat(formData.retailPrice) || 0,
          wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
          stockQuantity: parseInt(formData.stockQuantity) || 0,
          minimumStockLevel: parseInt(formData.minimumStockLevel) || 10,
          description: formData.description,
          barcode: formData.barcode,
          imageUrl: uploadedImageUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Product added successfully!', type: 'success' });
        setShowAddModal(false);
        resetForm();
        fetchProducts();
      } else {
        setToast({ message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setToast({ message: 'Failed to add product', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);

    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          costPrice: parseFloat(formData.costPrice) || 0,
          retailPrice: parseFloat(formData.retailPrice) || 0,
          wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
          stockQuantity: parseInt(formData.stockQuantity) || 0,
          minimumStockLevel: parseInt(formData.minimumStockLevel) || 10,
          description: formData.description,
          barcode: formData.barcode,
          imageUrl: formData.imageUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Product updated successfully!', type: 'success' });
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchProducts();
      } else {
        setToast({ message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setToast({ message: 'Failed to update product', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);

    try {
      const response = await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: parseInt(restockQuantity)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: `Stock restocked! Previous: ${data.previousStock}, New: ${data.newStock}`, type: 'success' });
        setShowRestockModal(false);
        setSelectedProduct(null);
        setRestockQuantity('');
        fetchProducts();
      } else {
        setToast({ message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error restocking:', error);
      setToast({ message: 'Failed to restock', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);

    try {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustment: parseInt(adjustQuantity),
          reason: adjustReason
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: `Stock adjusted! Previous: ${data.previousStock}, New: ${data.newStock}`, type: 'success' });
        setShowAdjustModal(false);
        setSelectedProduct(null);
        setAdjustQuantity('');
        setAdjustReason('');
        fetchProducts();
      } else {
        setToast({ message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setToast({ message: 'Failed to adjust stock', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/inventory?id=${productId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Product deleted successfully!', type: 'success' });
        fetchProducts();
      } else {
        setToast({ message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setToast({ message: 'Failed to delete product', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      costPrice: product.cost_price?.toString() || '',
      retailPrice: product.retail_price?.toString() || '',
      wholesalePrice: product.wholesale_price?.toString() || '',
      stockQuantity: product.stock_quantity?.toString() || '',
      minimumStockLevel: product.minimum_stock_level?.toString() || '10',
      description: product.description || '',
      barcode: product.barcode || '',
      imageUrl: product.image_url || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      costPrice: '',
      retailPrice: '',
      wholesalePrice: '',
      stockQuantity: '',
      minimumStockLevel: '10',
      description: '',
      barcode: '',
      imageUrl: ''
    });
    setCurrentStep(1);
    setImageFile(null);
    setImagePreview('');
  };

  const generateSKU = async () => {
    // Generate SKU format: PRODUCTNAME-NUMBER (e.g., DIAMOND-1, DIAMOND-2)
    // Get the current product count to determine the next number
    try {
      const response = await fetch('/api/inventory/list?limit=1');
      const data = await response.json();
      const totalProducts = data.pagination?.total || 0;
      const nextNumber = totalProducts + 1;
      
      // Get first word of product name or use "PROD" if name is empty
      const productName = formData.name.trim();
      const namePrefix = productName 
        ? productName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
        : 'PROD';
      
      const sku = `${namePrefix}-${nextNumber}`;
      setFormData({ ...formData, sku });
    } catch (error) {
      console.error('Error generating SKU:', error);
      // Fallback to simple random number if API fails
      const randomNum = Math.floor(Math.random() * 10000) + 1;
      const productName = formData.name.trim();
      const namePrefix = productName 
        ? productName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
        : 'PROD';
      const sku = `${namePrefix}-${randomNum}`;
      setFormData({ ...formData, sku });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Image size must be less than 5MB', type: 'error' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Please select a valid image file', type: 'error' });
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Core Details';
      case 2: return 'Organization';
      case 3: return 'Units, Conversion & Pricing';
      case 4: return 'Stock & Review';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const exportInventory = () => {
    const headers = ['Name', 'SKU', 'Category', 'Stock', 'Retail Price', 'Wholesale Price', 'Date Added'];
    const rows = products.map(p => [
      p.name,
      p.sku,
      p.category,
      p.stock_quantity || 0,
      p.retail_price?.toFixed(2) || '0.00',
      p.wholesale_price?.toFixed(2) || '0.00',
      formatDate(p.created_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Inventory</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage your product inventory and stock levels.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportInventory}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 text-sm hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            {filterTab === 'archived' && (
              <button
                onClick={() => setFilterTab('all')}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 text-sm hover:bg-[var(--bg-primary)] transition-colors"
              >
                View Active
              </button>
            )}
            {filterTab !== 'archived' && (
              <button
                onClick={() => setFilterTab('archived')}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 text-sm hover:bg-[var(--bg-primary)] transition-colors"
              >
                View Archived
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[var(--border-color)]">
          <button
            onClick={() => setFilterTab('all')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              filterTab === 'all'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setFilterTab('parent')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              filterTab === 'parent'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Parent Products
          </button>
          <button
            onClick={() => setFilterTab('archived')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              filterTab === 'archived'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Search and Category Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Variant</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Retail Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Wholesale Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Date Added</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded flex items-center justify-center text-xl">
                            📦
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">{product.name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {product.variant_of ? 'Variant' : 'Parent'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${
                          product.stock_quantity < product.minimum_stock_level
                            ? 'text-red-500'
                            : 'text-[var(--text-primary)]'
                        }`}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                        KES {product.retail_price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        KES {product.wholesale_price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {formatDate(product.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group">
                          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg font-bold">
                            •••
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => { setSelectedProduct(product); setShowRestockModal(true); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-primary)] first:rounded-t-lg"
                            >
                              Restock
                            </button>
                            <button
                              onClick={() => { setSelectedProduct(product); setShowAdjustModal(true); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-primary)]"
                            >
                              Adjust Stock
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement view history functionality
                                setToast({ message: 'View History feature coming soon', type: 'info' });
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-primary)]"
                            >
                              View History
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-primary)]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-primary)] text-red-500 hover:text-red-600 last:rounded-b-lg"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalProducts > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalProducts}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              itemName="products"
            />
          )}

        </div>
      </div>

      {/* Add Product Modal - Multi-Step Wizard */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Add New Product Wizard</h2>
              <p className="text-sm text-[var(--text-secondary)]">Step {currentStep} of {totalSteps}: {getStepTitle()}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step <= currentStep 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        step < currentStep ? 'bg-emerald-600' : 'bg-[var(--border-color)]'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-6">
              {/* Step 1: Core Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">SKU *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Click refresh to auto-generate"
                        />
                        <button
                          type="button"
                          onClick={generateSKU}
                          title="Auto-generate SKU"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-emerald-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={4}
                      placeholder="Kaulo best quality"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Image</label>
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg border border-[var(--border-color)]"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-color)] rounded-lg cursor-pointer bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-[var(--text-secondary)]">Click to upload image</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">PNG, JPG up to 5MB</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Organization */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Kaulo plates</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Variant of (Optional)</label>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">
                      If this is a variant (e.g., size or color), select the main product.
                    </p>
                    <select
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Kenstar Soup Plate (GEN-KEN-0007)</option>
                      {products.filter(p => !p.variant_of).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Units, Conversion & Pricing */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Base Unit (for selling)</label>
                      <select
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="piece">piece</option>
                        <option value="box">box</option>
                        <option value="dozen">dozen</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="litre">litre</option>
                        <option value="ml">ml</option>
                        <option value="pack">pack</option>
                        <option value="1/2 dozen">1/2 dozen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Purchase Unit (for restocking)</label>
                      <select
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select purchase unit...</option>
                        <option value="piece">piece</option>
                        <option value="box">box</option>
                        <option value="dozen">dozen</option>
                        <option value="kg">kg</option>
                        <option value="litre">litre</option>
                        <option value="pack">pack</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Selling Mode</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input type="radio" name="sellingMode" value="retail" className="mr-2" defaultChecked />
                        <span className="text-sm">Retail Only</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="sellingMode" value="wholesale" className="mr-2" />
                        <span className="text-sm">Wholesale Only</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="sellingMode" value="both" className="mr-2" />
                        <span className="text-sm">Both</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Buying Price (per piece)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Retail Price (per piece)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.retailPrice}
                        onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Wholesale Price (per piece)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Stock & Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Initial Stock (in dozens)</label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Retail Stock (pieces)</label>
                      <input
                        type="number"
                        value={formData.minimumStockLevel}
                        onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Min Wholesale Stock (pieces)</label>
                      <input
                        type="number"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Review Section */}
                  <div className="border-t border-[var(--border-color)] pt-6">
                    <h3 className="text-lg font-semibold mb-4">Review Product Details</h3>
                    <div className="bg-[var(--bg-primary)] rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded flex items-center justify-center text-2xl">
                          IMG
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-[var(--text-secondary)]">Name:</span>
                            <span className="ml-2 font-medium">{formData.name || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">SKU:</span>
                            <span className="ml-2 font-medium">{formData.sku || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Category:</span>
                            <span className="ml-2">{formData.category || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Base Unit:</span>
                            <span className="ml-2">piece</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Purchase Unit:</span>
                            <span className="ml-2">-</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Buying Price:</span>
                            <span className="ml-2">{formData.costPrice || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Retail Price:</span>
                            <span className="ml-2">{formData.retailPrice || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Wholesale Price:</span>
                            <span className="ml-2">{formData.wholesalePrice || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Initial Stock:</span>
                            <span className="ml-2">{formData.stockQuantity || '0'} (dozens)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-6 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Cancel
                </button>
                
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      prevStep();
                    }}
                    className="px-6 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    Back
                  </button>
                )}

                <div className="flex-1"></div>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      nextStep();
                    }}
                    className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2.5 rounded-lg font-semibold transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Product'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Retail Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Wholesale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Stock Level</label>
                  <input
                    type="number"
                    value={formData.minimumStockLevel}
                    onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Upload image to Imgur or image hosting service, then paste URL here</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(selectedProduct.id)}
                  className="px-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold"
                >
                  {loading ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-6">Restock {selectedProduct.name}</h2>
            
            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Stock</label>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm">
                  {selectedProduct.stock_quantity || 0} piece(s)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Restock In</label>
                <select
                  value={restockUnit}
                  onChange={(e) => setRestockUnit(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="piece">piece</option>
                  <option value="dozen">dozen</option>
                  <option value="carton">carton</option>
                  <option value="box">box</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity to Add</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Type (for history)</label>
                <select
                  value={restockStockType}
                  onChange={(e) => setRestockStockType(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { 
                    setShowRestockModal(false); 
                    setSelectedProduct(null); 
                    setRestockQuantity(''); 
                    setRestockUnit('piece');
                    setRestockStockType('Retail');
                  }}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] py-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors text-sm"
                >
                  {loading ? 'Restocking...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm">
                  {selectedProduct.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Stock</label>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm">
                  {selectedProduct.stock_quantity || 0} units
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Adjustment *</label>
                <input
                  type="number"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Use negative for decrease (e.g., -5)"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Use positive numbers to add, negative to subtract
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Optional reason for adjustment"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAdjustModal(false); setSelectedProduct(null); setAdjustQuantity(''); setAdjustReason(''); }}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold"
                >
                  {loading ? 'Adjusting...' : 'Adjust Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
