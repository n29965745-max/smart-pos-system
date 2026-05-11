import React, { useEffect, useState } from 'react';
import DateRangeFilter, { getDateRange, formatDateLocal } from '../components/DateRangeFilter';
import Pagination from '../components/Pagination';

interface Expense {
  id: string;
  expense_id: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  vendor_name: string;
  expense_date: string;
  status: string;
  created_by: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    payment_method: 'Cash',
    vendor_name: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const [stats, setStats] = useState({
    todayTotal: 0,
    businessTotal: 0,
    personalTotal: 0,
    totalExpenses: 0,
    categoryTotals: {} as { [key: string]: number },
    todayGrossRevenue: 0,
    todayNetRevenue: 0,
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
        console.log('Date changed from', currentDate, 'to', newDate, '- updating expenses...');
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
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter, methodFilter, startDate, endDate]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const [statsRes, expensesRes, categoriesRes, dashboardRes] = await Promise.all([
        fetch('/api/expenses/stats'),
        fetch(`/api/expenses?${params}`),
        fetch('/api/expenses/categories'),
        fetch('/api/dashboard/comprehensive-stats?range=today'),
      ]);

      const statsData = await statsRes.json();
      const expensesData = await expensesRes.json();
      const categoriesData = await categoriesRes.json();
      const dashboardData = await dashboardRes.json();

      setStats({
        todayTotal: statsData.todayTotal || 0,
        businessTotal: statsData.businessTotal || 0,
        personalTotal: statsData.personalTotal || 0,
        totalExpenses: statsData.totalExpenses || 0,
        categoryTotals: statsData.categoryTotals || {},
        todayGrossRevenue: dashboardData.data?.grossRevenue || 0,
        todayNetRevenue: (dashboardData.data?.grossRevenue || 0) - (statsData.todayTotal || 0),
      });

      setExpenses(expensesData.expenses || []);
      setTotalPages(expensesData.pagination?.totalPages || 1);
      setTotalExpenses(expensesData.pagination?.total || 0);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(e => e.payment_method === methodFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.expense_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filtering - compare ISO timestamps
    if (startDate && endDate) {
      filtered = filtered.filter(e => {
        const expenseDate = new Date(e.expense_date).toISOString();
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    }

    setFilteredExpenses(filtered);
  };


  const handleAddExpense = async () => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewExpense({
          category: '',
          amount: '',
          description: '',
          payment_method: 'Cash',
          vendor_name: '',
          expense_date: new Date().toISOString().split('T')[0],
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleApproveExpense = async (expenseId: string, status: 'Approved' | 'Rejected' | 'Pending') => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          approved_by: user.name || 'Admin'
        }),
      });

      if (response.ok) {
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating expense:', error);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Expense Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filters - Horizontal Layout */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Stats Cards - Mobile First: 1 col mobile → 2 cols tablet → 3 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[var(--text-secondary)] text-sm">Today's Expenses</p>
            <span className="text-red-500 text-lg">📉</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">KSH {stats.todayTotal.toFixed(2)}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">No expenses recorded today</p>
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex-1 min-h-[44px] px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center justify-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add
            </button>
            <button className="flex-1 min-h-[44px] px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] flex items-center justify-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              View
            </button>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[var(--text-secondary)] text-sm">Today's Net Revenue</p>
            <span className="text-green-500 text-lg">📈</span>
          </div>
          <p className="text-2xl font-bold text-green-500">KSH {stats.todayNetRevenue.toFixed(2)}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">from KSH {stats.todayGrossRevenue.toFixed(2)} gross · {stats.todayGrossRevenue > 0 ? ((stats.todayNetRevenue / stats.todayGrossRevenue) * 100).toFixed(1) : '0.0'}% margin</p>
          <div className="mt-3 space-y-1.5 bg-[var(--bg-tertiary)] rounded-lg p-3">
            {[
              { label: 'Gross Revenue', value: `KSH ${stats.todayGrossRevenue.toFixed(2)}` },
              { label: 'Returns', value: '-KSH 0.00' },
              { label: 'Business Expenses', value: `-KSH ${stats.todayTotal.toFixed(2)}` },
              { label: 'Personal Expenses', value: '-KSH 0.00' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{row.label}</span>
                <span className="text-[var(--text-primary)]">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-semibold border-t border-[var(--border-color)] pt-1.5">
              <span className="text-[var(--text-primary)]">Net Revenue (All)</span>
              <span className="text-green-500">KSH {stats.todayNetRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[var(--text-secondary)] text-sm">Expense Overview</p>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalExpenses}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Active categories</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Business:</span>
              <span className="text-[var(--text-primary)]">KSH {stats.businessTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Personal:</span>
              <span className="text-[var(--text-primary)]">KSH {stats.personalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table - Mobile Optimized */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[var(--border-color)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Expenses (All Users)</h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                Total: KSH {stats.businessTotal + stats.personalTotal}.00 • Business: KSH {stats.businessTotal}.00 • Personal: KSH {stats.personalTotal}.00
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Expense
            </button>
          </div>

          {/* Search and Filters - Stack on mobile */}
          <div className="space-y-3">
            <div className="relative">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table with horizontal scroll on mobile */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Expense ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Description</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Method</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Status</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-[var(--text-secondary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                      <p className="text-sm text-[var(--text-secondary)]">No expenses found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-3 py-3 text-xs text-[var(--text-primary)] font-mono whitespace-nowrap">{expense.expense_id}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] whitespace-nowrap">{expense.category}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] max-w-[200px] truncate" title={expense.description}>{expense.description}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] font-semibold whitespace-nowrap">KSH {expense.amount.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-primary)] hidden sm:table-cell whitespace-nowrap">{expense.payment_method}</td>
                    <td className="px-3 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell whitespace-nowrap">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        expense.status === 'Approved' ? 'bg-green-500/20 text-green-500' : 
                        expense.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                          title="Actions"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {openMenuId === expense.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-xl z-20 py-1">
                              {expense.status !== 'Approved' && (
                                <button
                                  onClick={() => {
                                    handleApproveExpense(expense.id, 'Approved');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left min-h-[44px] px-4 py-2.5 text-sm hover:bg-[var(--bg-primary)] text-green-600 hover:text-green-700 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Approve
                                </button>
                              )}
                              {expense.status !== 'Rejected' && (
                                <button
                                  onClick={() => {
                                    handleApproveExpense(expense.id, 'Rejected');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left min-h-[44px] px-4 py-2.5 text-sm hover:bg-[var(--bg-primary)] text-red-600 hover:text-red-700 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  Reject
                                </button>
                              )}
                              {expense.status !== 'Pending' && (
                                <button
                                  onClick={() => {
                                    handleApproveExpense(expense.id, 'Pending');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left min-h-[44px] px-4 py-2.5 text-sm hover:bg-[var(--bg-primary)] text-yellow-600 hover:text-yellow-700 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                  Set Pending
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalExpenses > 0 && (
          <div className="p-3 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalExpenses}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
              itemName="expenses"
            />
          </div>
        )}
      </div>

      {/* Add Expense Modal - Mobile Optimized */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] w-full max-w-md shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Add New Expense</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={newExpense.payment_method}
                onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>Cash</option>
                <option>M-Pesa</option>
                <option>Bank Transfer</option>
                <option>Card</option>
              </select>
              <input
                type="text"
                placeholder="Vendor Name (Optional)"
                value={newExpense.vendor_name}
                onChange={(e) => setNewExpense({ ...newExpense, vendor_name: e.target.value })}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="p-4 sm:p-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
