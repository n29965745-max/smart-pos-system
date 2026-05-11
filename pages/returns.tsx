import React, { useEffect, useState } from 'react';
import DateRangeFilter, { getDateRange, formatDateLocal } from '../components/DateRangeFilter';
import Pagination from '../components/Pagination';

interface Return {
  id: string;
  return_id: string;
  transaction_id: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  amount: number;
  reason: string;
  status: string;
  return_date: string;
  processed_date: string | null;
}

export default function Returns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string; stock: number }>>([]);
  const [createFormData, setCreateFormData] = useState({
    transactionId: '',
    customerName: '',
    reason: '',
  });
  const [returnItems, setReturnItems] = useState<Array<{
    productName: string;
    quantity: number;
    amount: number;
  }>>([{ productName: '', quantity: 1, amount: 0 }]);
  const [createFormErrors, setCreateFormErrors] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [transactionItems, setTransactionItems] = useState<Array<any>>([]);
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [productSearchTerms, setProductSearchTerms] = useState<string[]>(['']);
  const [unitPrices, setUnitPrices] = useState<number[]>([0]);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReturns, setTotalReturns] = useState(0);

  const [stats, setStats] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    completedReturns: 0,
    totalReturnValue: 0,
    todayReturnCount: 0,
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    // Convert selected range to actual dates
    const updateDates = () => {
      const { startDate: start, endDate: end } = getDateRange(dateRange);
      
      if (start && end) {
        // Format with full timestamp for API
        setStartDate(start.toISOString());
        setEndDate(end.toISOString());
      } else {
        // For 'all', clear the date range
        setStartDate('');
        setEndDate('');
      }
    };

    // Update dates immediately
    updateDates();
  }, [dateRange]);

  // Check for date change every 10 seconds
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const newDate = now.toDateString();
      
      // If the date has changed, update dates immediately
      if (newDate !== currentDate) {
        console.log('Date changed from', currentDate, 'to', newDate, '- updating returns...');
        setCurrentDate(newDate);
        
        // Re-calculate date range for current selection
        const { startDate: start, endDate: end } = getDateRange(dateRange);
        if (start && end) {
          setStartDate(start.toISOString());
          setEndDate(end.toISOString());
        }
        
        // Refresh data
        fetchData();
      }
    };

    // Check every 10 seconds for date changes
    const interval = setInterval(checkDateChange, 10000);

    return () => clearInterval(interval);
  }, [currentDate, dateRange]);

  useEffect(() => {
    filterReturns();
  }, [returns, searchTerm, statusFilter, startDate, endDate]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const [statsRes, returnsRes, productsRes] = await Promise.all([
        fetch('/api/returns/stats'),
        fetch(`/api/returns?${params}`),
        fetch('/api/products/list'),
      ]);

      const statsData = await statsRes.json();
      const returnsData = await returnsRes.json();
      const productsData = await productsRes.json();

      setStats({
        totalReturns: statsData.totalReturns || 0,
        pendingReturns: statsData.pendingReturns || 0,
        completedReturns: statsData.completedReturns || 0,
        totalReturnValue: statsData.totalReturnValue || 0,
        todayReturnCount: statsData.todayReturnCount || 0,
      });

      setReturns(returnsData.returns || []);
      setTotalPages(returnsData.pagination?.totalPages || 1);
      setTotalReturns(returnsData.pagination?.total || 0);
      
      // Set available products for the dropdown - API returns { products: [...] }
      const productsList = productsData.products || [];
      console.log('Products fetched:', productsList.length, 'items');
      if (Array.isArray(productsList) && productsList.length > 0) {
        const mappedProducts = productsList.map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock_quantity || 0,
        }));
        console.log('Mapped products:', mappedProducts);
        setAvailableProducts(mappedProducts);
      } else {
        console.warn('No products found or invalid format');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReturns = () => {
    let filtered = returns;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.return_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filtering - compare ISO timestamps
    if (startDate && endDate) {
      filtered = filtered.filter(r => {
        const returnDate = new Date(r.return_date).toISOString();
        return returnDate >= startDate && returnDate <= endDate;
      });
    }

    setFilteredReturns(filtered);
  };

  const handleProcessReturn = async (returnId: string, status: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          processed_by: 'Admin',
          refund_method: 'Cash',
          refund_amount: selectedReturn?.amount || 0,
        }),
      });

      if (response.ok) {
        setShowProcessModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error processing return:', error);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormErrors('');
    setSubmitting(true);

    // Validation
    if (!createFormData.transactionId || !createFormData.reason) {
      setCreateFormErrors('Please fill in transaction ID and return reason');
      setSubmitting(false);
      return;
    }

    // Validate at least one item
    const validItems = returnItems.filter(item => item.productName && item.quantity > 0);
    if (validItems.length === 0) {
      setCreateFormErrors('Please add at least one product to return');
      setSubmitting(false);
      return;
    }

    try {
      // Create a return for each item
      const promises = validItems.map(item =>
        fetch('/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: createFormData.transactionId,
            product_name: item.productName,
            customer_name: createFormData.customerName || 'Walk-in Customer',
            quantity: item.quantity,
            amount: item.amount,
            reason: createFormData.reason,
            status: 'Pending',
          }),
        })
      );

      const responses = await Promise.all(promises);
      const failedResponses = responses.filter(r => !r.ok);

      if (failedResponses.length > 0) {
        const errorData = await failedResponses[0].json();
        setCreateFormErrors(errorData.error || 'Failed to create some returns');
      } else {
        setShowCreateModal(false);
        setCreateFormData({
          transactionId: '',
          customerName: '',
          reason: '',
        });
        setReturnItems([{ productName: '', quantity: 1, amount: 0 }]);
        setTransactionItems([]);
        setProductSearchTerms(['']);
        setUnitPrices([0]);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating returns:', error);
      setCreateFormErrors('Failed to create returns. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTransactionDetails = async (transactionId: string) => {
    if (!transactionId.trim()) {
      setTransactionItems([]);
      return;
    }

    setLoadingTransaction(true);
    try {
      const response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}`);
      if (response.ok) {
        const data = await response.json();
        setTransactionItems(data.items || []);
        
        // Auto-fill customer name if available
        if (data.transaction.customer_name) {
          setCreateFormData(prev => ({
            ...prev,
            customerName: data.transaction.customer_name
          }));
        }
      } else {
        setTransactionItems([]);
        console.log('Transaction not found');
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setTransactionItems([]);
    } finally {
      setLoadingTransaction(false);
    }
  };

  const handleProductSelect = (index: number, productName: string) => {
    const newItems = [...returnItems];
    newItems[index].productName = productName;

    // Auto-fill quantity and price from transaction if available
    const transactionItem = transactionItems.find(
      item => item.product_name === productName
    );

    if (transactionItem) {
      const quantity = transactionItem.quantity;
      const totalPrice = parseFloat(transactionItem.subtotal);
      const unitPrice = totalPrice / quantity;

      newItems[index].quantity = quantity;
      newItems[index].amount = totalPrice;

      // Store unit price for this item
      const newUnitPrices = [...unitPrices];
      newUnitPrices[index] = unitPrice;
      setUnitPrices(newUnitPrices);
    }

    setReturnItems(newItems);
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const newItems = [...returnItems];
    newItems[index].quantity = newQuantity;

    // Auto-calculate price based on unit price if available
    if (unitPrices[index] && unitPrices[index] > 0) {
      newItems[index].amount = unitPrices[index] * newQuantity;
    }

    setReturnItems(newItems);
  };

  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return availableProducts;
    
    const term = searchTerm.toLowerCase();
    return availableProducts.filter(product =>
      product.name.toLowerCase().includes(term)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-primary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Page Title */}
      <div className="mb-3 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Returns Management</h1>
      </div>

      {/* Action Button */}
      <div className="mb-3 sm:mb-4">
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Return
          </button>
        </div>
      </div>

      {/* Filters - Horizontal Layout */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            startDate={startDate ? formatDateLocal(new Date(startDate)) : ''}
            endDate={endDate ? formatDateLocal(new Date(endDate)) : ''}
            onDateChange={(start, end) => {
              const s = new Date(start); s.setHours(0,0,0,0);
              const e = new Date(end); e.setHours(23,59,59,999);
              setStartDate(s.toISOString()); setEndDate(e.toISOString());
            }}
          />
          <button 
            className="min-h-[44px] min-w-[44px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2.5 hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-center" 
            title="Export"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
        </div>
      </div>

      {/* Stats Cards - Mobile First: 2 cols mobile → 3 cols tablet → 5 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Total Returns', value: stats.totalReturns, color: 'text-[var(--text-primary)]', icon: '↩️' },
          { label: 'Pending', value: stats.pendingReturns, color: 'text-yellow-500', icon: '⏳' },
          { label: 'Completed', value: stats.completedReturns, color: 'text-green-500', icon: '✓' },
          { label: 'Return Value', value: `KES ${stats.totalReturnValue.toFixed(2)}`, color: 'text-[var(--text-primary)]', icon: '💰' },
          { label: "Today's Returns", value: stats.todayReturnCount, color: 'text-[var(--text-primary)]', icon: '📅' },
        ].map(card => (
          <div key={card.label} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 hover:border-[var(--text-secondary)] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm">{card.label}</p>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${card.color} truncate`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Return History - Mobile First */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[var(--border-color)]">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">Return History</h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-3">A list of all processed returns</p>
          <div className="relative">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search returns..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
        </div>

        {/* Table with horizontal scroll on mobile */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Return ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Transaction</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Reason</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Qty</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Date</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-[var(--text-secondary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-[var(--text-secondary)]">No returns found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-3 py-3 text-xs text-[var(--text-primary)] font-mono whitespace-nowrap">
                      <span className="inline-block max-w-[100px] truncate" title={returnItem.return_id}>
                        {returnItem.return_id.slice(0,8)}...
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] whitespace-nowrap">{returnItem.transaction_id}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] max-w-[150px] truncate" title={returnItem.reason}>{returnItem.reason}</td>
                    <td className="px-3 py-3 hidden sm:table-cell whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(returnItem.status)}`}>
                        {returnItem.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] hidden sm:table-cell whitespace-nowrap">{returnItem.quantity}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] hidden lg:table-cell whitespace-nowrap">KES {returnItem.amount.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell whitespace-nowrap">{new Date(returnItem.return_date).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button 
                        onClick={() => { setSelectedReturn(returnItem); setShowProcessModal(true); }}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                        title="Process return"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalReturns > 0 && (
          <div className="p-3 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalReturns}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
              itemName="returns"
            />
          </div>
        )}
      </div>

      {/* Create Return Modal - Mobile Optimized */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] p-4 sm:p-6 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Create Return</h2>
            </div>
            
            <div className="p-4 sm:p-6">
            <form onSubmit={handleCreateReturn} className="space-y-4">
              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Transaction ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={createFormData.transactionId}
                    onChange={(e) => {
                      setCreateFormData({ ...createFormData, transactionId: e.target.value });
                      fetchTransactionDetails(e.target.value);
                    }}
                    placeholder="e.g., TXN-001 or paste transaction number"
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  {loadingTransaction && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {transactionItems.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ Transaction found with {transactionItems.length} items
                  </p>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={createFormData.customerName}
                  onChange={(e) => setCreateFormData({ ...createFormData, customerName: e.target.value })}
                  placeholder="Optional - defaults to Walk-in Customer"
                  className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Return Reason */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Return Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={createFormData.reason}
                  onChange={(e) => setCreateFormData({ ...createFormData, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Defective">Defective Product</option>
                  <option value="Wrong Item">Wrong Item Received</option>
                  <option value="Not as Described">Not as Described</option>
                  <option value="Changed Mind">Customer Changed Mind</option>
                  <option value="Damaged">Damaged During Shipping</option>
                  <option value="Quality Issues">Quality Issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Items to Return */}
              <div className="border-t border-[var(--border-color)] pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Items to Return <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnItems([...returnItems, { productName: '', quantity: 1, amount: 0 }]);
                      setProductSearchTerms([...productSearchTerms, '']);
                      setUnitPrices([...unitPrices, 0]);
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    + Add Item
                  </button>
                </div>

                {transactionItems.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
                      📦 Items from Transaction:
                    </p>
                    <div className="space-y-1">
                      {transactionItems.map((item, idx) => (
                        <div key={idx} className="text-xs text-blue-600 dark:text-blue-400">
                          • {item.product_name} - Qty: {item.quantity} - KES {parseFloat(item.subtotal).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {returnItems.map((item, index) => (
                    <div key={index} className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Item {index + 1}</span>
                        {returnItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturnItems(returnItems.filter((_, i) => i !== index));
                              setProductSearchTerms(productSearchTerms.filter((_, i) => i !== index));
                              setUnitPrices(unitPrices.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Product Search and Select */}
                        <div>
                          <label className="block text-xs text-[var(--text-secondary)] mb-1">
                            Product {transactionItems.length > 0 && '(auto-fills from transaction)'}
                          </label>
                          
                          {/* Search Input */}
                          <input
                            type="text"
                            value={productSearchTerms[index] || ''}
                            onChange={(e) => {
                              const newSearchTerms = [...productSearchTerms];
                              newSearchTerms[index] = e.target.value;
                              setProductSearchTerms(newSearchTerms);
                            }}
                            placeholder="🔍 Type to search products..."
                            className="w-full px-3 py-2 mb-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />

                          {/* Filtered Product List */}
                          <div className="max-h-40 overflow-y-auto border border-[var(--border-color)] rounded bg-[var(--bg-tertiary)]">
                            {getFilteredProducts(productSearchTerms[index]).length > 0 ? (
                              getFilteredProducts(productSearchTerms[index]).map((product) => {
                                const isFromTransaction = transactionItems.some(
                                  ti => ti.product_name === product.name
                                );
                                return (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => {
                                      handleProductSelect(index, product.name);
                                      const newSearchTerms = [...productSearchTerms];
                                      newSearchTerms[index] = product.name;
                                      setProductSearchTerms(newSearchTerms);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-secondary)] border-b border-[var(--border-color)] last:border-b-0 ${
                                      item.productName === product.name ? 'bg-emerald-500/10 text-emerald-600' : 'text-[var(--text-primary)]'
                                    } ${isFromTransaction ? 'font-medium' : ''}`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>
                                        {isFromTransaction && '✓ '}
                                        {product.name}
                                      </span>
                                      <span className="text-xs text-[var(--text-secondary)]">
                                        Stock: {product.stock}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                                {productSearchTerms[index] ? 'No products found' : 'Start typing to search...'}
                              </div>
                            )}
                          </div>

                          {item.productName && (
                            <p className="text-xs text-emerald-600 mt-1">
                              Selected: {item.productName}
                            </p>
                          )}
                        </div>

                        {/* Quantity and Amount */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">
                              Quantity {transactionItems.length > 0 && '(auto-filled)'}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                            {unitPrices[index] > 0 && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                Unit price: KES {unitPrices[index].toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">
                              Amount (KES) {unitPrices[index] > 0 && '(auto-calculated)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => {
                                const newItems = [...returnItems];
                                newItems[index].amount = parseFloat(e.target.value) || 0;
                                setReturnItems(newItems);
                              }}
                              placeholder="0.00"
                              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {unitPrices[index] > 0 && (
                              <p className="text-xs text-emerald-600 mt-1">
                                ✓ Auto-calculated
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  💡 Tip: Enter transaction ID to auto-fill. Adjust quantity and price auto-calculates!
                </p>
              </div>

              {/* Error Message */}
              {createFormErrors && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{createFormErrors}</p>
                </div>
              )}

              {/* Action Buttons - Mobile First */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {submitting ? 'Creating...' : `Create Return (${returnItems.filter(i => i.productName).length} items)`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      transactionId: '',
                      customerName: '',
                      reason: '',
                    });
                    setReturnItems([{ productName: '', quantity: 1, amount: 0 }]);
                    setTransactionItems([]);
                    setProductSearchTerms(['']);
                    setUnitPrices([0]);
                    setCreateFormErrors('');
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Process Modal - Mobile Optimized */}
      {showProcessModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] w-full max-w-md shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Process Return</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-secondary)]">Return ID</span>
                  <span className="text-sm text-[var(--text-primary)] font-mono">{selectedReturn.return_id.slice(0,12)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-secondary)]">Customer</span>
                  <span className="text-sm text-[var(--text-primary)]">{selectedReturn.customer_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-secondary)]">Product</span>
                  <span className="text-sm text-[var(--text-primary)] truncate max-w-[200px]" title={selectedReturn.product_name}>{selectedReturn.product_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-secondary)]">Amount</span>
                  <span className="text-sm text-[var(--text-primary)] font-semibold">KES {selectedReturn.amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleProcessReturn(selectedReturn.id, 'Completed')}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Approve
                </button>
                <button
                  onClick={() => handleProcessReturn(selectedReturn.id, 'Rejected')}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Reject
                </button>
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="w-full min-h-[44px] px-4 py-2.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
