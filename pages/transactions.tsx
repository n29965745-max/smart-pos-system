import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DateRangeFilter, { getDateRange, formatDateLocal } from '../components/DateRangeFilter';
import Pagination from '../components/Pagination';
import ReceiptPrint from '../components/ReceiptPrint';

interface Transaction {
  id: string;
  transaction_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  items_count: number;
  items: any[];
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTransaction, setReturnTransaction] = useState<Transaction | null>(null);
  const [returnForm, setReturnForm] = useState({ reason: '', notes: '' });
  const [returnItems, setReturnItems] = useState<Array<{ product_name: string; quantity: number; amount: number }>>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());

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
        console.log('Date changed from', currentDate, 'to', newDate, '- updating transactions...');
        setCurrentDate(newDate);
        
        // Re-calculate date range for current selection
        const { startDate: start, endDate: end } = getDateRange(dateRange);
        if (start && end) {
          setStartDate(start.toISOString());
          setEndDate(end.toISOString());
        }
      }
    };

    // Check every 10 seconds for date changes
    const interval = setInterval(checkDateChange, 10000);

    return () => clearInterval(interval);
  }, [currentDate, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [searchQuery, filterType, paymentFilter, startDate, endDate, currentPage, itemsPerPage]);

  // Fetch shop settings once on mount
  useEffect(() => {
    fetch('/api/shop-settings')
      .then(r => r.json())
      .then(d => { if (d.settings) setShopSettings(d.settings); })
      .catch(() => {});
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        priceType: filterType,
        paymentMethod: paymentFilter,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/transactions/list?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalTransactions(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      completed: 'bg-emerald-500/20 text-emerald-500',
      pending: 'bg-yellow-500/20 text-yellow-500',
      cancelled: 'bg-red-500/20 text-red-500'
    };

    return statusColors[status.toLowerCase()] || 'bg-gray-500/20 text-gray-500';
  };

  const getTypeBadge = (items: any[]) => {
    if (!items || items.length === 0) return 'Retail';
    const hasWholesale = items.some(item => item.price_type === 'wholesale');
    return hasWholesale ? 'Wholesale' : 'Retail';
  };

  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTransactions();
      } else {
        alert('Failed to delete transaction');
      }
    } catch {
      alert('Error deleting transaction');
    }
  };

  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const printReceipt = (transaction: Transaction) => {
    setReceiptTransaction(transaction);
    setShowReceipt(true);
  };

  const createReturn = (transaction: Transaction) => {
    setReturnTransaction(transaction);
    // Pre-fill return items from transaction items
    const items = transaction.items.map(item => ({
      product_name: item.product_name,
      quantity: item.quantity,
      amount: parseFloat(item.total_price || item.subtotal || 0)
    }));
    setReturnItems(items.length > 0 ? items : [{ product_name: '', quantity: 1, amount: 0 }]);
    setReturnForm({ reason: '', notes: '' });
    setReturnError('');
    setReturnSuccess(false);
    setShowReturnModal(true);
  };

  const submitReturn = async () => {
    if (!returnTransaction) return;
    if (!returnForm.reason) { setReturnError('Please select a reason'); return; }
    if (returnItems.some(i => !i.product_name || i.quantity < 1 || i.amount <= 0)) {
      setReturnError('Please fill in all item details'); return;
    }

    setSubmittingReturn(true);
    setReturnError('');
    try {
      // Submit one return record per item
      for (const item of returnItems) {
        const res = await fetch('/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: returnTransaction.transaction_number,
            customer_name: returnTransaction.customer_name || 'Walk-in Customer',
            product_name: item.product_name,
            quantity: item.quantity,
            amount: item.amount,
            reason: returnForm.reason,
            notes: returnForm.notes
          })
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to create return');
        }
      }
      setReturnSuccess(true);
      setTimeout(() => { setShowReturnModal(false); setReturnSuccess(false); }, 2000);
    } catch (e: any) {
      setReturnError(e.message);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const exportTransactions = () => {
    // Simple CSV export
    const headers = ['Transaction ID', 'Customer', 'Date', 'Items', 'Type', 'Status', 'Total'];
    const rows = transactions.map(t => [
      t.transaction_number,
      t.customer_name || 'Walk-in Customer',
      formatDate(t.created_at),
      t.items_count,
      getTypeBadge(t.items),
      t.status,
      `KSH ${t.total.toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Transactions</h1>
        </div>

        {/* Action Button */}
        <div className="mb-4 sm:mb-5">
          <div className="flex justify-end">
            <button
              onClick={() => router.push('/pos')}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg px-4 py-3 sm:py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Sale
            </button>
          </div>
        </div>

        {/* Filters - Horizontal Layout */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 mb-6 shadow-sm">
          {/* Type Tabs and Date Range - Single Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
              {['all', 'retail', 'wholesale'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all capitalize min-h-[40px] whitespace-nowrap ${
                    filterType === t 
                      ? 'bg-emerald-600 text-white font-medium shadow-sm' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Date Range Filter */}
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

            {/* Export Button */}
            <button 
              onClick={exportTransactions}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2.5 hover:bg-[var(--bg-primary)] active:scale-95 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Export CSV"
            >
              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          {/* Search and Payment Filter - Stack on Mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search transactions by ID or customer..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-3 sm:py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>
            <select 
              value={paymentFilter} 
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full sm:w-auto bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-3 sm:py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Table - Mobile Optimized with Horizontal Scroll */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        <p className="text-sm text-[var(--text-secondary)]">Loading transactions...</p>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-[var(--text-secondary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-[var(--text-secondary)]">No transactions found</p>
                      </div>
                    </td>
                  </tr>
                ) : transactions.map(t => (
                  <tr key={t.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">{t.transaction_number}</td>
                    <td className="px-4 py-4 text-sm text-[var(--text-primary)]">{t.customer_name || 'Walk-in Customer'}</td>
                    <td className="px-4 py-4 text-sm text-[var(--text-secondary)] hidden sm:table-cell whitespace-nowrap">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {getTypeBadge(t.items)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-emerald-500 whitespace-nowrap">KSH {t.total.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative inline-block">
                        <button 
                          onClick={e => { e.stopPropagation(); setOpenActionMenu(openActionMenu === t.id ? null : t.id); }}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                        {openActionMenu === t.id && (
                          <div 
                            onClick={e => e.stopPropagation()} 
                            className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-30 overflow-hidden"
                          >
                            <button 
                              onClick={() => { viewTransactionDetails(t); setOpenActionMenu(null); }} 
                              className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                            <button 
                              onClick={() => { printReceipt(t); setOpenActionMenu(null); }} 
                              className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print Receipt
                            </button>
                            <button 
                              onClick={() => { createReturn(t); setOpenActionMenu(null); }} 
                              className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors flex items-center gap-3 border-t border-[var(--border-color)]"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Create Return
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalTransactions > 0 && (
            <div className="border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                totalItems={totalTransactions}
                itemsPerPage={itemsPerPage} 
                onPageChange={setCurrentPage}
                onItemsPerPageChange={n => { setItemsPerPage(n); setCurrentPage(1); }} 
                itemName="transactions" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Transaction Details</h2>
                <p className="text-sm text-[var(--text-secondary)]">{selectedTransaction.transaction_number}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Name:</span>
                    <p className="font-medium">{selectedTransaction.customer_name || 'Walk-in Customer'}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Phone:</span>
                    <p className="font-medium">{selectedTransaction.customer_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Transaction Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Date:</span>
                    <p className="font-medium">{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Time:</span>
                    <p className="font-medium">{formatTime(selectedTransaction.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Payment Method:</span>
                    <p className="font-medium capitalize">{selectedTransaction.payment_method}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedTransaction.status)}`}>
                      {selectedTransaction.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Items ({selectedTransaction.items_count})</h3>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm py-2 border-b border-[var(--border-color)] last:border-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {item.quantity} x KSH {parseFloat(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">KSH {parseFloat(item.total_price || item.subtotal || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Subtotal:</span>
                    <span className="font-medium">KSH {selectedTransaction.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--border-color)]">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg text-emerald-500">KSH {selectedTransaction.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="w-full mt-6 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Receipt Modal */}
      {showReceipt && receiptTransaction && (
        <ReceiptPrint
          data={{
            transactionNumber: receiptTransaction.transaction_number,
            date: receiptTransaction.created_at,
            customerName: receiptTransaction.customer_name || 'Walk-in Customer',
            customerPhone: receiptTransaction.customer_phone || '',
            items: receiptTransaction.items.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: parseFloat(item.unit_price),
              price_type: 'retail',
              subtotal: parseFloat(item.total_price || item.subtotal || 0)
            })),
            subtotal: receiptTransaction.total,
            discount: 0,
            tax: 0,
            total: receiptTransaction.total,
            amountPaid: receiptTransaction.total,
            change: 0,
            paymentMethod: receiptTransaction.payment_method,
            cashierName: 'Cashier',
            shopName: shopSettings?.business_name || 'Nyla Wigs',
            shopTagline: shopSettings?.business_tagline || '',
            shopLogo: shopSettings?.logo_url || '',
            shopAddress: shopSettings?.business_address || '',
            shopPhone: shopSettings?.business_phone || '',
            shopEmail: shopSettings?.business_email || ''
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
      {/* Return Modal */}
      {showReturnModal && returnTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Create Return</h2>
              <button onClick={() => setShowReturnModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            {returnSuccess ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-emerald-500 font-semibold">Return created successfully!</p>
              </div>
            ) : (
              <>
                {/* Pre-filled info */}
                <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Transaction</span>
                    <span className="font-medium text-[var(--text-primary)]">{returnTransaction.transaction_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Customer</span>
                    <span className="font-medium text-[var(--text-primary)]">{returnTransaction.customer_name || 'Walk-in Customer'}</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Return Reason *</label>
                  <select
                    value={returnForm.reason}
                    onChange={e => setReturnForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Select reason...</option>
                    <option value="Defective product">Defective product</option>
                    <option value="Wrong item">Wrong item</option>
                    <option value="Customer changed mind">Customer changed mind</option>
                    <option value="Damaged in transit">Damaged in transit</option>
                    <option value="Not as described">Not as described</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Items to Return *</label>
                  <div className="space-y-2">
                    {returnItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          className="col-span-5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-2 py-1.5 text-xs text-[var(--text-primary)]"
                          placeholder="Product name"
                          value={item.product_name}
                          onChange={e => { const n = [...returnItems]; n[i].product_name = e.target.value; setReturnItems(n); }}
                        />
                        <input
                          type="number" min="1"
                          className="col-span-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-2 py-1.5 text-xs text-[var(--text-primary)]"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => { const n = [...returnItems]; n[i].quantity = parseInt(e.target.value) || 1; setReturnItems(n); }}
                        />
                        <input
                          type="number" min="0" step="0.01"
                          className="col-span-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-2 py-1.5 text-xs text-[var(--text-primary)]"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={e => { const n = [...returnItems]; n[i].amount = parseFloat(e.target.value) || 0; setReturnItems(n); }}
                        />
                        <button
                          onClick={() => setReturnItems(returnItems.filter((_, idx) => idx !== i))}
                          className="col-span-2 text-red-500 hover:text-red-400 text-xs"
                          disabled={returnItems.length === 1}
                        >Remove</button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setReturnItems([...returnItems, { product_name: '', quantity: 1, amount: 0 }])}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-400"
                  >+ Add item</button>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Notes (optional)</label>
                  <textarea
                    value={returnForm.notes}
                    onChange={e => setReturnForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                    placeholder="Additional notes..."
                  />
                </div>

                {returnError && <p className="text-red-500 text-sm mb-3">{returnError}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={submitReturn}
                    disabled={submittingReturn}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {submittingReturn ? 'Submitting...' : 'Submit Return'}
                  </button>
                  <button
                    onClick={() => setShowReturnModal(false)}
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] py-2 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
