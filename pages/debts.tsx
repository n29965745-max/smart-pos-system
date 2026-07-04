import React, { useState, useEffect } from 'react';
import DateRangeFilter, { getDateRange, formatDateLocal } from '../components/DateRangeFilter';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import ResponsiveGrid, { ResponsiveCard } from '../components/ResponsiveGrid';
import ResponsiveFilters from '../components/ResponsiveFilters';

interface Debt {
  id: string;
  customer_name: string;
  sale_id: string;
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  status: string;
  due_date: string;
  created_at: string;
}

export default function DebtManagement() {
  const { toast, showToast, hideToast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentModal, setPaymentModal] = useState<{ show: boolean; debt: Debt | null }>({
    show: false,
    debt: null,
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDebts();
    fetchStats();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      let url = '/api/debts?page=1&limit=100';
      
      // Apply date range from dropdown
      const range = getDateRange(dateFilter);
      const sd = startDate || (range.startDate ? formatDateLocal(range.startDate) : '');
      const ed = endDate || (range.endDate ? formatDateLocal(range.endDate) : '');
      
      if (sd && ed) url += `&startDate=${sd}&endDate=${ed}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) setDebts(data.debts || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (val: string) => {
    setDateFilter(val);
    setStartDate('');
    setEndDate('');
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setDateFilter('all');
  };

  const handleRefreshData = () => {
    fetchDebts();
    fetchStats();
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/debts/stats');
      const data = await response.json();
      if (response.ok) setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePayment = async () => {
    if (!paymentModal.debt || !paymentAmount) return;

    try {
      const response = await fetch(`/api/debts/${paymentModal.debt.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
        }),
      });

      if (response.ok) {
        showToast('Payment recorded successfully!', 'success');
        setPaymentModal({ show: false, debt: null });
        setPaymentAmount('');
        fetchDebts();
        fetchStats();
      } else {
        const data = await response.json();
        showToast(data.error || 'Payment failed', 'error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Payment failed', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Paid' || status === 'paid') {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Paid</span>;
    }
    return <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Outstanding</span>;
  };

  const outstandingDebts = debts.filter(d => d.amount_remaining > 0);

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] p-4 sm:p-5 lg:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Debt Management</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">Monitor customer credit, outstanding balances, and payment history.</p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRefreshData}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-primary)] text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>

            <DateRangeFilter
              value={dateFilter}
              onChange={handleDateFilterChange}
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-sm">Outstanding Debt</div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {formatCurrency(stats.totalOutstanding || 0)}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {outstandingDebts.length} customers with debt
                </div>
              </div>
              <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-sm">Today's Debt</div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {formatCurrency(stats.todayDebt || 0)}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">0 outstanding today</div>
              </div>
              <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-sm">Total Credit Limit</div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {formatCurrency(stats.totalCreditLimit || 0)}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {stats.utilizationPercent || 0}% utilized • set per customer
                </div>
              </div>
              <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>

          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-sm">Active Debts</div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {stats.activeDebts || 0}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{debts.length} total debt records</div>
              </div>
              <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[var(--text-secondary)] text-sm">Recent Payments</div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {stats.paidDebts || 0}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">All-time payment records</div>
              </div>
              <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border-color)] overflow-x-auto">
          <div className="flex gap-6 sm:gap-8 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('all-debts')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'all-debts'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Debts
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab('customer-summary')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'customer-summary'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Customer Summary
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Recent Outstanding Debts</h2>
              <div className="space-y-3">
                {outstandingDebts.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-secondary)]">No outstanding debts</div>
                ) : (
                  outstandingDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[var(--text-primary)]">{debt.customer_name}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{debt.sale_id} • {formatDate(debt.created_at)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-[var(--text-primary)]">{formatCurrency(debt.amount_remaining)}</div>
                          <button
                            onClick={() => setPaymentModal({ show: true, debt })}
                            className="min-h-[36px] mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors"
                          >
                            Partial
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all-debts' && (
          <div>
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>
              ) : debts.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">No debts found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)] hidden sm:table-cell">Sale ID</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--text-primary)] hidden md:table-cell">Total</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--text-primary)] hidden lg:table-cell">Paid</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--text-primary)]">Remaining</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)] hidden sm:table-cell">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {debts.map((debt) => (
                        <tr key={debt.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                          <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{debt.customer_name}</td>
                          <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden sm:table-cell">{debt.sale_id}</td>
                          <td className="px-4 py-3 text-sm text-right text-[var(--text-primary)] hidden md:table-cell">
                            {formatCurrency(debt.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-400 hidden lg:table-cell">
                            {formatCurrency(debt.amount_paid)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-yellow-400 font-semibold">
                            {formatCurrency(debt.amount_remaining)}
                          </td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">{getStatusBadge(debt.status)}</td>
                          <td className="px-4 py-3 text-center">
                            {debt.amount_remaining > 0 && (
                              <button
                                onClick={() => setPaymentModal({ show: true, debt })}
                                className="min-h-[36px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors"
                              >
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <p>Payment history and records will be displayed here</p>
          </div>
        )}

        {activeTab === 'customer-summary' && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <p>Customer credit summary and details will be displayed here</p>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModal.show && paymentModal.debt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Record Payment</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[var(--text-secondary)]">Customer</div>
                  <div className="text-[var(--text-primary)] font-medium">{paymentModal.debt.customer_name}</div>
                </div>
                
                <div>
                  <div className="text-sm text-[var(--text-secondary)]">Outstanding Amount</div>
                  <div className="text-[var(--text-primary)] font-medium">
                    {formatCurrency(paymentModal.debt.amount_remaining)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={paymentModal.debt.amount_remaining}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setPaymentModal({ show: false, debt: null });
                    setPaymentAmount('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  }

