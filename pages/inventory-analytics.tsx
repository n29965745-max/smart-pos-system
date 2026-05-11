import React, { useState, useEffect } from 'react';
import DateRangeFilter, { getDateRange, formatDateLocal } from '../components/DateRangeFilter';

interface InventoryAnalytics {
  overview: {
    inventoryValueCost: string;
    inventoryValueSelling: string;
    potentialProfit: string;
    lowStockAlerts: number;
    totalReturns: number;
    pendingReturns: number;
    valueOfReturns: string;
    archivedItems: number;
  };
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    minimumStock: number;
  }>;
}

export default function InventoryAnalyticsPage() {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('retail');
  const [useDemoData, setUseDemoData] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());

  const demoData: InventoryAnalytics = {
    overview: {
      inventoryValueCost: '19112750.36',
      inventoryValueSelling: '28294220.00',
      potentialProfit: '9181469.64',
      lowStockAlerts: 3,
      totalReturns: 109,
      pendingReturns: 7,
      valueOfReturns: '39899.02',
      archivedItems: 68
    },
    lowStockItems: [
      { id: '1', name: 'Stainless steel plate', sku: 'GEN-STA-00605', quantity: 0, minimumStock: 0 },
      { id: '2', name: 'Doffi 10kg', sku: 'GEN-DOF-00602', quantity: 0, minimumStock: 0 }
    ]
  };

  useEffect(() => {
    // Convert selected range to actual dates
    const updateDates = () => {
      const { startDate: start, endDate: end } = getDateRange(dateFilter);
      
      if (start && end) {
        setStartDate(formatDateLocal(start));
        setEndDate(formatDateLocal(end));
      } else {
        // For 'all', clear the date range
        setStartDate('');
        setEndDate('');
      }
    };

    // Update dates immediately
    updateDates();
  }, [dateFilter]);

  // Check for date change every 10 seconds
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const newDate = now.toDateString();
      
      // If the date has changed, update dates immediately
      if (newDate !== currentDate) {
        console.log('Date changed from', currentDate, 'to', newDate, '- updating inventory analytics...');
        setCurrentDate(newDate);
        
        // Re-calculate date range for current selection
        const { startDate: start, endDate: end } = getDateRange(dateFilter);
        if (start && end) {
          setStartDate(formatDateLocal(start));
          setEndDate(formatDateLocal(end));
        }
      }
    };

    // Check every 10 seconds for date changes
    const interval = setInterval(checkDateChange, 10000);

    return () => clearInterval(interval);
  }, [currentDate, dateFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, filterType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('priceType', filterType);

      const response = await fetch(`/api/inventory-analytics/overview?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
        setUseDemoData(false);
      } else {
        setAnalytics(demoData);
        setUseDemoData(true);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(demoData);
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Page Title */}
      <div className="mb-3 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Inventory Analytics</h1>
      </div>

      {/* Filters - Horizontal Layout */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="min-h-[44px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
          <DateRangeFilter 
            value={dateFilter}
            onChange={setDateFilter}
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
        </div>
      </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <div className="text-sm text-[var(--text-secondary)]">Loading analytics...</div>
            </div>
          </div>
        ) : analytics ? (
          <>
            {/* Primary Metrics - Mobile First: 1 col mobile → 2 cols tablet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Inventory Value (Cost)</span>
                  <span className="text-lg sm:text-xl">💵</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-[var(--text-primary)] truncate">KSH {analytics.overview.inventoryValueCost}</div>
                <div className="text-xs text-[var(--text-secondary)]">Total capital invested in stock</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Inventory Value (Selling)</span>
                  <span className="text-lg sm:text-xl">📈</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-[var(--text-primary)] truncate">KSH {analytics.overview.inventoryValueSelling}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Potential revenue at {filterType} prices
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Potential Profit</span>
                  <span className="text-lg sm:text-xl">📊</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-green-500 truncate">KSH {analytics.overview.potentialProfit}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Potential profit at {filterType} prices
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Low Stock Alerts</span>
                  <span className="text-lg sm:text-xl">⚠️</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-red-500">{analytics.overview.lowStockAlerts}</div>
                <div className="text-xs text-[var(--text-secondary)]">Items at or below minimum stock level</div>
              </div>
            </div>

            {/* Secondary Metrics - Mobile First: 1 col mobile → 2 cols tablet → 4 cols desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Total Returns</span>
                  <span className="text-lg sm:text-xl">↩️</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-[var(--text-primary)]">{analytics.overview.totalReturns}</div>
                <div className="text-xs text-[var(--text-secondary)]">Completed returns in date range</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Pending Returns</span>
                  <span className="text-lg sm:text-xl">⏳</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-amber-500">{analytics.overview.pendingReturns}</div>
                <div className="text-xs text-[var(--text-secondary)]">Returns awaiting action</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Value of Returns</span>
                  <span className="text-lg sm:text-xl">💰</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-red-500 truncate">KSH {analytics.overview.valueOfReturns}</div>
                <div className="text-xs text-[var(--text-secondary)]">Total value of completed returns</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Archived Items</span>
                  <span className="text-lg sm:text-xl">📦</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-[var(--text-primary)]">{analytics.overview.archivedItems}</div>
                <div className="text-xs text-[var(--text-secondary)]">Products with zero stock or archived</div>
              </div>
            </div>

            {/* Low Stock Items Table - Mobile Optimized */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Low Stock Items</h2>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  {analytics.lowStockItems.length} items at or below minimum stock levels
                </p>
              </div>

              {/* Table with horizontal scroll on mobile */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Product</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">SKU</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Qty</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Min</th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {analytics.lowStockItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 text-[var(--text-secondary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-[var(--text-secondary)]">No low stock items</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      analytics.lowStockItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 bg-[var(--bg-primary)] rounded flex items-center justify-center text-sm shrink-0">
                                📦
                              </div>
                              <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[150px] sm:max-w-none" title={item.name}>{item.name}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-[var(--text-secondary)] hidden sm:table-cell whitespace-nowrap">{item.sku}</td>
                          <td className="px-3 sm:px-6 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 text-sm font-bold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-[var(--text-secondary)] hidden md:table-cell whitespace-nowrap">{item.minimumStock}</td>
                          <td className="px-3 sm:px-6 py-4 text-center">
                            <button className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-blue-500 hover:text-blue-400 hover:bg-[var(--bg-primary)] rounded-lg transition-colors" title="Restock">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)]">No data available</p>
            </div>
          </div>
        )}
    </div>
  );
}
