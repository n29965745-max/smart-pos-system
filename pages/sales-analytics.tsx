import React, { useState, useEffect } from 'react';
import DateRangeFilter, { getDateRange, formatDateLocal } from '../components/DateRangeFilter';

interface AnalyticsData {
  overview: {
    totalTransactions: number;
    averageTransactionValue: string;
    totalDiscounts: string;
    grossSalesRevenue: string;
    retailRevenue: string;
    wholesaleRevenue: string;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: string;
  }>;
}

export default function SalesAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());

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
        console.log('Date changed from', currentDate, 'to', newDate, '- updating sales analytics...');
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
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/sales-analytics/overview?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      } else {
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      cash: '#E5E7EB',
      mpesa: '#10B981',
      card: '#3B82F6',
      bank: '#8B5CF6'
    };
    return colors[method.toLowerCase()] || '#6B7280';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Page Title */}
      <div className="mb-3 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Sales Analytics</h1>
      </div>

      {/* Filters - Horizontal Layout */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
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
            {/* Metrics Grid - Mobile First: 1 col mobile → 2 cols tablet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Total Transactions</span>
                  <span className="text-lg sm:text-xl">#</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-[var(--text-primary)]">{analytics.overview.totalTransactions}</div>
                <div className="text-xs text-[var(--text-secondary)]">Number of sales in period</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Average Transaction Value</span>
                  <span className="text-lg sm:text-xl">📊</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-[var(--text-primary)] truncate">KSH {analytics.overview.averageTransactionValue}</div>
                <div className="text-xs text-[var(--text-secondary)]">Average spend per sale</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Total Discounts</span>
                  <span className="text-lg sm:text-xl">%</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-red-500 truncate">KSH {analytics.overview.totalDiscounts}</div>
                <div className="text-xs text-[var(--text-secondary)]">Total value of discounts given</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--text-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">Gross Sales Revenue</span>
                  <span className="text-lg sm:text-xl">📈</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1 text-[var(--text-primary)] truncate">KSH {analytics.overview.grossSalesRevenue}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Retail: KSH {analytics.overview.retailRevenue} | Wholesale: KSH {analytics.overview.wholesaleRevenue}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  Total sales before returns & expenses
                </div>
              </div>
            </div>

            {/* Payment Methods Chart - Mobile Optimized */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">Payment Methods</h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Breakdown of transactions by payment method</p>
              </div>

              <div className="p-4 sm:p-6">
              {analytics.paymentMethods && analytics.paymentMethods.length > 0 ? (
                <>
                  {/* Pie Chart - Responsive sizing */}
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[400px] aspect-square flex items-center justify-center">
                      {/* Pie Chart using conic-gradient */}
                      <div 
                        className="w-full h-full rounded-full relative shadow-lg"
                        style={{
                          background: `conic-gradient(${analytics.paymentMethods.map((pm, index) => {
                            const prevPercentage = analytics.paymentMethods
                              .slice(0, index)
                              .reduce((sum, p) => sum + parseFloat(p.percentage), 0);
                            const currentPercentage = parseFloat(pm.percentage);
                            return `${getPaymentMethodColor(pm.method)} ${prevPercentage}% ${prevPercentage + currentPercentage}%`;
                          }).join(', ')})`
                        }}
                      >
                        {/* Labels positioned around the chart - Hidden on mobile for clarity */}
                        <div className="hidden sm:block">
                          {analytics.paymentMethods.map((pm, index) => {
                            const prevPercentage = analytics.paymentMethods
                              .slice(0, index)
                              .reduce((sum, p) => sum + parseFloat(p.percentage), 0);
                            const currentPercentage = parseFloat(pm.percentage);
                            const midPercentage = prevPercentage + (currentPercentage / 2);
                            const angle = (midPercentage / 100) * 360 - 90;
                            const radian = (angle * Math.PI) / 180;
                            const radius = 140;
                            const x = Math.cos(radian) * radius;
                            const y = Math.sin(radian) * radius;

                            return (
                              <div
                                key={pm.method}
                                className="absolute text-xs sm:text-sm font-bold whitespace-nowrap bg-white px-2 py-1 rounded shadow-md"
                                style={{
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                  color: '#1F2937'
                                }}
                              >
                                {pm.method} {pm.percentage}%
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend - Mobile First: Stack on mobile, wrap on larger screens */}
                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 sm:gap-6">
                    {analytics.paymentMethods.map(pm => (
                      <div key={pm.method} className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg">
                        <div
                          className="w-4 h-4 rounded shrink-0"
                          style={{ backgroundColor: getPaymentMethodColor(pm.method) }}
                        />
                        <span className="text-xs sm:text-sm capitalize text-[var(--text-primary)]">
                          {pm.method}: {pm.count} ({pm.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20 text-[var(--text-secondary)] opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm text-[var(--text-secondary)] text-center max-w-md px-4">
                    No payment data available for the selected period.
                    <br className="hidden sm:block" />
                    Make some sales to see payment method analytics.
                  </p>
                </div>
              )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)]">No data available</p>
            </div>
          </div>
        )}
    </div>
  );
}
