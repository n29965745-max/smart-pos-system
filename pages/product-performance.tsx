import React, { useState, useEffect } from 'react';
import DateRangeFilter, { getDateRange } from '../components/DateRangeFilter';

interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  unitsSold: number;
  netRevenue: string;
  netCost: string;
  netProfit: string;
  profitMargin: string;
  returnRate: string;
}

export default function ProductPerformancePage() {
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [displayDateRange, setDisplayDateRange] = useState({ start: '', end: '' });
  const [selectedRange, setSelectedRange] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());

  useEffect(() => {
    // Convert selected range to actual dates
    const updateDates = () => {
      const { startDate: start, endDate: end } = getDateRange(selectedRange);
      
      if (start && end) {
        // ISO timestamps for API
        setDateRange({
          start: start.toISOString(),
          end: end.toISOString()
        });
        
        // YYYY-MM-DD format for display
        const formatForDisplay = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        setDisplayDateRange({
          start: formatForDisplay(start),
          end: formatForDisplay(end)
        });
      } else {
        // For 'all', clear the date range
        setDateRange({ start: '', end: '' });
        setDisplayDateRange({ start: '', end: '' });
      }
    };

    // Update dates immediately
    updateDates();
  }, [selectedRange]);

  // Check for date change every 10 seconds
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const newDate = now.toDateString();
      
      // If the date has changed, update dates immediately
      if (newDate !== currentDate) {
        console.log('Date changed from', currentDate, 'to', newDate, '- updating product performance...');
        setCurrentDate(newDate);
        
        // Re-calculate date range for current selection
        const { startDate: start, endDate: end } = getDateRange(selectedRange);
        if (start && end) {
          setDateRange({
            start: start.toISOString(),
            end: end.toISOString()
          });
          
          const formatForDisplay = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          setDisplayDateRange({
            start: formatForDisplay(start),
            end: formatForDisplay(end)
          });
        }
      }
    };

    // Check every 10 seconds for date changes
    const interval = setInterval(checkDateChange, 10000);

    return () => clearInterval(interval);
  }, [currentDate, selectedRange]);

  useEffect(() => {
    fetchPerformance();
  }, [dateRange, searchQuery]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/product-performance/overview?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching product performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPerformance();
  };

  const handleDateRangeChange = (start: string, end: string) => {
    // Convert YYYY-MM-DD to ISO timestamp for API
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T23:59:59.999');
    setDateRange({ 
      start: startDate.toISOString(), 
      end: endDate.toISOString() 
    });
    setDisplayDateRange({ start, end });
  };

  const exportToCSV = () => {
    const headers = ['Product', 'Units Sold', 'Net Revenue', 'Net Cost', 'Net Profit', 'Profit Margin', 'Return Rate'];
    const rows = products.map(p => [
      p.name,
      p.unitsSold,
      `KSH ${p.netRevenue}`,
      `KSH ${p.netCost}`,
      `KSH ${p.netProfit}`,
      `${p.profitMargin}%`,
      `${p.returnRate}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <div className="p-4 sm:p-5 lg:p-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-5 lg:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Product Performance</h1>
        </div>

        {/* Filters - Horizontal Layout */}
        <div className="mb-4 sm:mb-5 lg:mb-6">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <DateRangeFilter 
                value={selectedRange}
                onChange={setSelectedRange}
                startDate={displayDateRange.start}
                endDate={displayDateRange.end}
                onDateChange={handleDateRangeChange}
              />
              
              <button
                onClick={exportToCSV}
                className="min-h-[44px] min-w-[44px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-2"
                title="Export CSV"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - Full Width with Touch Targets */}
        <div className="mb-4 sm:mb-5 lg:mb-6">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg pl-10 pr-24 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 min-h-[36px] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Performance Table - Responsive Column Hiding */}
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Product</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Units</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Revenue</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Cost</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Profit</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Margin</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Returns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-[var(--text-secondary)]">Loading product performance...</p>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-[var(--text-secondary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-[var(--text-secondary)]">No product performance data found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{product.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{product.sku}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-[var(--text-primary)]">
                        {product.unitsSold}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-[var(--text-primary)]">
                        KSH {parseFloat(product.netRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                        KSH {parseFloat(product.netCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-emerald-500">
                        KSH {parseFloat(product.netProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-[var(--text-primary)]">
                        {parseFloat(product.profitMargin).toFixed(2)}%
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                        {parseFloat(product.returnRate).toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {parseFloat(product.returnRate).toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats - Responsive Grid */}
        {products.length > 0 && (
          <div className="mt-4 sm:mt-5 lg:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{products.length}</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Total Units Sold</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                {products.reduce((sum, p) => sum + p.unitsSold, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-500">
                KSH {products.reduce((sum, p) => sum + parseFloat(p.netRevenue), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Total Profit</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-500">
                KSH {products.reduce((sum, p) => sum + parseFloat(p.netProfit), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
