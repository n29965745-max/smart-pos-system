import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DateRangeFilter, { getDateRange, formatDateLocal } from '../components/DateRangeFilter';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import ResponsiveGrid, { ResponsiveCard } from '../components/ResponsiveGrid';
import ResponsiveFilters from '../components/ResponsiveFilters';

interface DashboardStats {
  allTimeProfit: number;
  potentialProfit: number;
  grossRevenue: number;
  todayNetRevenue: number; // Actually the selected range's net revenue
  todayExpenses: number; // Actually the selected range's expenses
  todayReturns: number; // Actually the selected range's returns
  inventoryValueCost: number;
  inventoryValueSelling: number;
  totalUnits: number;
  retailRevenue: number;
  wholesaleRevenue: number;
  retailProfit: number;
  wholesaleProfit: number;
  retailSales: number;
  wholesaleSales: number;
  productCategories: number;
  outstandingDebt: number;
  lowStockCount: number;
  pricingAudit: {
    total: number;
    valid: number;
    issues: number;
    issueDetails?: {
      missingCost: number;
      zeroSellingPrice: number;
      sellingBelowCost: number;
      unrealisticMarkup: number;
    };
  };
  chartData?: Array<{
    date: string;
    gross: number;
    net: number;
    expenses: number;
    profit: number;
  }>;
}

export default function Dashboard() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priceType, setPriceType] = useState('retail'); // retail or wholesale only
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showPricingProducts, setShowPricingProducts] = useState(false);
  const [pricingProducts, setPricingProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;

  // Track the current date to detect changes
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());

  // Update startDate and endDate when dateRange changes
  useEffect(() => {
    const { startDate: start, endDate: end } = getDateRange(dateRange);
    
    if (start && end) {
      setStartDate(formatDateLocal(start));
      setEndDate(formatDateLocal(end));
    } else {
      // For 'all', clear the date range
      setStartDate('');
      setEndDate('');
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats(true); // Initial load with loading spinner
  }, [dateRange, priceType]);

  // Auto-refresh every 30 seconds (silent, no loading spinner)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false); // Background refresh without loading spinner
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [dateRange, priceType]);

  // Check for date change every 10 seconds and refresh data immediately
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const newDate = now.toDateString();
      
      // If the date has changed, refresh data immediately
      if (newDate !== currentDate) {
        console.log('Date changed from', currentDate, 'to', newDate, '- refreshing dashboard data...');
        setCurrentDate(newDate);
        fetchStats(false); // Silent refresh when date changes
      }
    };

    // Check every 10 seconds for date changes
    const interval = setInterval(checkDateChange, 10000);

    return () => clearInterval(interval);
  }, [currentDate, dateRange, priceType]);

  const fetchStats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      // Add timestamp and date to force cache busting and help with debugging
      const timestamp = new Date().getTime();
      const currentDateStr = new Date().toISOString();
      console.log('Fetching dashboard stats at:', currentDateStr);
      console.log('Date range:', dateRange, 'Price type:', priceType);
      
      const response = await fetch(`/api/dashboard/comprehensive-stats?range=${dateRange}&priceType=${priceType}&t=${timestamp}&clientDate=${encodeURIComponent(currentDateStr)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();

      console.log('Dashboard API Response:', data);
      console.log('Server Time:', data.serverTime);
      console.log('Today Net Revenue:', data.data?.todayNetRevenue);
      console.log('Chart Data:', data.data?.chartData);

      if (data.success) {
        setStats(data.data);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchPricingProducts = async () => {
    if (loadingProducts) return;
    
    setLoadingProducts(true);
    try {
      const response = await fetch('/api/products/list');
      const data = await response.json();
      
      console.log('=== PRICING PRODUCTS FETCH ===');
      console.log('API Response:', data);
      console.log('Total products fetched:', data.products?.length || 0);
      
      if (data.products) {
        // Filter products with pricing issues and add issue type
        // Match the exact logic from comprehensive-stats API
        // Only show ACTIVE products in the dropdown
        const productsWithIssues = data.products.filter((product: any) => {
          // Only show active products
          if (product.status !== 'active') return false;
          
          const costPrice = parseFloat(product.cost_price) || 0;
          const retailPrice = parseFloat(product.retail_price) || 0;
          const wholesalePrice = parseFloat(product.wholesale_price) || 0;
          
          // Determine issue types - match exact API logic
          const issues: string[] = [];
          let hasIssue = false;

          // Check 1: Missing cost price
          if (costPrice === 0 || !product.cost_price) {
            hasIssue = true;
            issues.push('No Cost');
          }

          // Check 2: Zero selling price (both retail and wholesale) - only if no previous issue
          if (!hasIssue && (retailPrice === 0 || !product.retail_price) && (wholesalePrice === 0 || !product.wholesale_price)) {
            hasIssue = true;
            issues.push('Zero Price');
          }

          // Check 3: Selling below cost (retail) - only if no previous issue
          if (!hasIssue && costPrice > 0 && retailPrice > 0 && retailPrice < costPrice) {
            hasIssue = true;
            issues.push('Below Cost');
          }

          // Check 4: Selling below cost (wholesale) - only if no previous issue
          if (!hasIssue && costPrice > 0 && wholesalePrice > 0 && wholesalePrice < costPrice) {
            hasIssue = true;
            issues.push('Below Cost');
          }

          // Check 5: Unrealistic markup (>500%) - only if no previous issue
          if (!hasIssue && costPrice > 0 && retailPrice > 0) {
            const markup = ((retailPrice - costPrice) / costPrice) * 100;
            if (markup > 500) {
              hasIssue = true;
              issues.push('High Markup');
            }
          }
          
          if (hasIssue) {
            product.issues = issues;
            console.log('Product with issue:', product.name, 'Issues:', issues, 'Cost:', costPrice, 'Retail:', retailPrice, 'Wholesale:', wholesalePrice, 'Status:', product.status);
            return true;
          }
          return false;
        });
        
        console.log('Total products with issues:', productsWithIssues.length);
        console.log('Products with issues:', productsWithIssues);
        setPricingProducts(productsWithIssues);
      }
    } catch (error) {
      console.error('Failed to fetch pricing products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const renderChart = () => {
    // Reverse data so most recent dates are at the end (right side)
    const chartData = [...(stats?.chartData || [])].reverse();

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
          No transaction data available
        </div>
      );
    }

    const scale = 140000;
    const yLabels = [140000, 105000, 70000, 35000, 0];

    const formatCurrency = (val: number) => {
      if (val === 0) return 'KSH 0';
      return `KSH ${(val / 1000).toFixed(0)}k`;
    };

    // Calculate width to fit exactly in container without scrolling
    // Chart container is 2/3 of the page width, minus padding
    // Normal spacing with horizontal scrolling enabled
    const pointSpacing = 7;
    const svgWidth = Math.max(800, chartData.length * pointSpacing);
    const svgHeight = 240;
    const padding = { top: 10, right: 20, bottom: 30, left: 70 }; // Reduced bottom padding
    const plotHeight = svgHeight - padding.top - padding.bottom;
    const plotWidth = svgWidth - padding.left - padding.right;

    const getY = (value: number) => padding.top + plotHeight - (value / scale) * plotHeight;
    const getX = (index: number) => {
      if (chartData.length === 1) return padding.left + plotWidth / 2;
      return padding.left + (index / (chartData.length - 1)) * plotWidth;
    };

    const handleMouseEnter = (index: number) => setHoveredIndex(index);
    const handleMouseLeave = () => setHoveredIndex(null);

    return (
      <div className="flex flex-col h-full relative">
        <div className="flex flex-1">
          {/* Y-axis labels */}
          <div className="w-16 flex flex-col justify-between text-sm text-[var(--text-secondary)] pr-2 flex-shrink-0" style={{ paddingTop: '10px', paddingBottom: '35px' }}>
            {yLabels.map((label, i) => (
              <span key={i} className="text-right leading-none">{formatCurrency(label)}</span>
            ))}
          </div>

          {/* Chart SVG */}
          <div className="flex-1 overflow-x-auto relative">
            <svg width={svgWidth} height={svgHeight} style={{ minWidth: '100%' }}>
              {/* Dotted grid lines */}
              {yLabels.map((label, i) => (
                <line
                  key={`grid-${i}`}
                  x1={padding.left}
                  y1={getY(label)}
                  x2={svgWidth - padding.right}
                  y2={getY(label)}
                  stroke="currentColor"
                  strokeOpacity="0.15"
                  strokeDasharray="3,3"
                  strokeWidth="1"
                />
              ))}

              {/* Gross Sales - Green line with dots */}
              <polyline 
                points={chartData.map((d, i) => `${getX(i)},${getY(d.gross)}`).join(' ')}
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2" 
                opacity="0.9"
              />
              {chartData.map((data, i) => (
                <circle 
                  key={`gross-dot-${i}`}
                  cx={getX(i)} 
                  cy={getY(data.gross)} 
                  r="3.5" 
                  fill="#10b981" 
                  opacity="0.95"
                />
              ))}

              {/* Net Sales - Lighter green line with dots */}
              <polyline 
                points={chartData.map((d, i) => `${getX(i)},${getY(d.net)}`).join(' ')}
                fill="none" 
                stroke="#34d399" 
                strokeWidth="2" 
                opacity="0.85"
              />
              {chartData.map((data, i) => (
                <circle 
                  key={`net-dot-${i}`}
                  cx={getX(i)} 
                  cy={getY(data.net)} 
                  r="3.5" 
                  fill="#34d399" 
                  opacity="0.9"
                />
              ))}

              {/* Expenses - Red line with dots */}
              <polyline 
                points={chartData.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(' ')}
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2" 
                opacity="0.95"
              />
              {chartData.map((data, i) => (
                <circle 
                  key={`expense-dot-${i}`}
                  cx={getX(i)} 
                  cy={getY(data.expenses)} 
                  r="3" 
                  fill="#ef4444" 
                  opacity="0.95"
                />
              ))}

              {/* Verified Profit - Blue line with dots */}
              <polyline 
                points={chartData.map((d, i) => `${getX(i)},${getY(d.profit)}`).join(' ')}
                fill="none" 
                stroke="#60a5fa" 
                strokeWidth="2.5" 
                opacity="0.95"
              />
              {chartData.map((data, i) => (
                <circle 
                  key={`profit-dot-${i}`}
                  cx={getX(i)} 
                  cy={getY(data.profit)} 
                  r="4" 
                  fill="#60a5fa" 
                  opacity="0.95"
                />
              ))}

              {/* X-axis dates positioned below chart */}
              <g>
                {chartData.map((item, i) => {
                  const showEvery = Math.max(1, Math.floor(chartData.length / 6));
                  if (i % showEvery === 0 || i === chartData.length - 1) {
                    return (
                      <text
                        key={`date-${i}`}
                        x={getX(i)}
                        y={svgHeight - 5}
                        textAnchor="middle"
                        fontSize="11"
                        fill="var(--text-secondary)"
                        opacity="0.8"
                      >
                        {item.date}
                      </text>
                    );
                  }
                  return null;
                })}
              </g>

              {/* Invisible hover areas */}
              {chartData.map((data, i) => (
                <rect
                  key={`hover-${i}`}
                  x={getX(i) - 10}
                  y={padding.top}
                  width={20}
                  height={plotHeight}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && (
              <div 
                className="absolute bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-3 shadow-lg text-xs z-10"
                style={{
                  left: `${Math.min(getX(hoveredIndex) + 15, svgWidth - 200)}px`,
                  top: '10px',
                  pointerEvents: 'none'
                }}
              >
                <div className="font-semibold mb-2 text-[var(--text-primary)]">{chartData[hoveredIndex].date}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[var(--text-secondary)]">Gross: KSH {chartData[hoveredIndex].gross.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-[var(--text-secondary)]">Net: KSH {chartData[hoveredIndex].net.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-[var(--text-secondary)]">Expenses: KSH {chartData[hoveredIndex].expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-[var(--text-secondary)]">Profit: KSH {chartData[hoveredIndex].profit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-5 lg:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Header */}
        <ResponsiveFilters
          title="Dashboard Overview"
          subtitle="A summary of your business performance"
          actions={
            <>
              <select 
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full sm:w-auto bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 sm:py-2.5 text-sm text-[var(--text-primary)] min-h-[44px] sm:min-h-[36px]"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
              <DateRangeFilter 
                value={dateRange} 
                onChange={setDateRange}
                startDate={startDate}
                endDate={endDate}
                onDateChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
              <button className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] min-h-[44px] sm:min-h-[36px]">
                📤 Export Summary
              </button>
            </>
          }
        >
          <></>
        </ResponsiveFilters>

        {/* Top Row - Main Metrics */}
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap={4}>
          {/* All Time Verified Profit - Redesigned */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">
                {dateRange === 'all' ? 'All Time Verified Profit' :
                 dateRange === 'today' ? "Today's Verified Profit" :
                 dateRange === 'yesterday' ? "Yesterday's Verified Profit" :
                 dateRange === 'last7days' ? 'Last 7 Days Verified Profit' :
                 dateRange === 'last30days' ? 'Last 30 Days Verified Profit' :
                 dateRange === 'thisMonth' ? 'This Month Verified Profit' :
                 dateRange === 'lastMonth' ? 'Last Month Verified Profit' :
                 dateRange === 'thisYear' ? 'This Year Verified Profit' :
                 'Verified Profit'}
              </p>
              <span className="text-lg sm:text-xl flex-shrink-0">📈</span>
            </div>
            
            {/* Main Profit Amount */}
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-500 mb-2 break-words">
              KSH {stats?.allTimeProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            
            {/* Revenue and Margin */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <p className="text-[var(--text-secondary)] truncate pr-2">
                from KSH {stats?.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="px-2 sm:px-3 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex-shrink-0">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {stats?.grossRevenue > 0 ? ((stats?.allTimeProfit / stats?.grossRevenue) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
            
            {/* Retail and Wholesale Boxes */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Retail Box */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2">
                <p className="text-xs text-[var(--text-secondary)] mb-0.5">Retail</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mb-0.5 break-words">
                  KSH {stats?.retailProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {stats?.retailRevenue > 0 ? ((stats?.retailProfit / stats?.retailRevenue) * 100).toFixed(1) : '0.0'}% • {stats?.retailSales} sales
                </p>
              </div>
              
              {/* Wholesale Box */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2">
                <p className="text-xs text-[var(--text-secondary)] mb-0.5">Wholesale</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mb-0.5 break-words">
                  KSH {stats?.wholesaleProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {stats?.wholesaleRevenue > 0 ? ((stats?.wholesaleProfit / stats?.wholesaleRevenue) * 100).toFixed(1) : '0.0'}% • {stats?.wholesaleSales} sales
                </p>
              </div>
            </div>
            
            {/* Validation Note */}
            <p className="text-xs text-[var(--text-secondary)] italic">
              ✓ Strict validation applied • Excludes invalid pricing
            </p>
          </ResponsiveCard>

          {/* Potential Profit */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Potential Profit</p>
              <span className="text-lg sm:text-xl flex-shrink-0">📊</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-500 mb-2 break-words">
              KSH {stats?.potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Potential profit from inventory at {priceType} prices
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2 italic">
              ⚠ Profit is reduced due to pricing issues
            </p>
          </ResponsiveCard>

          {/* Gross Sales Revenue */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">
                {dateRange === 'all' ? 'Gross Sales Revenue' :
                 dateRange === 'today' ? "Today's Gross Sales" :
                 dateRange === 'yesterday' ? "Yesterday's Gross Sales" :
                 'Gross Sales Revenue'}
              </p>
              <span className="text-lg sm:text-xl flex-shrink-0">💰</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-500 mb-2 break-words">
              KSH {stats?.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="space-y-1 text-xs mt-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Retail</span>
                <span className="text-[var(--text-secondary)]">KSH {stats?.retailRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Wholesale</span>
                <span className="text-[var(--text-secondary)]">KSH {stats?.wholesaleRevenue.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Total sales before returns & expenses
            </p>
          </ResponsiveCard>

          {/* Net Revenue for Selected Range - Compact Design */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">
                {dateRange === 'today' ? "Today's Net Revenue" :
                 dateRange === 'yesterday' ? "Yesterday's Net Revenue" :
                 dateRange === 'last7days' ? "Last 7 Days Net Revenue" :
                 dateRange === 'last30days' ? "Last 30 Days Net Revenue" :
                 dateRange === 'thisMonth' ? "This Month Net Revenue" :
                 dateRange === 'lastMonth' ? "Last Month Net Revenue" :
                 dateRange === 'thisYear' ? "This Year Net Revenue" :
                 "Today's Net Revenue"}
              </p>
              <span className="text-lg sm:text-xl flex-shrink-0">💵</span>
            </div>
            
            {/* Main Net Revenue Amount */}
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-500 mb-2 break-words">
              KSH {((stats?.todayNetRevenue || 0) - (stats?.todayReturns || 0) - (stats?.todayExpenses || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            
            {/* From Gross and Margin */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <p className="text-[var(--text-secondary)] truncate pr-2">
                from KSH {stats?.todayNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="px-2 sm:px-3 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex-shrink-0">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {stats?.todayNetRevenue > 0 ? (((stats?.todayNetRevenue - stats?.todayReturns - stats?.todayExpenses) / stats?.todayNetRevenue) * 100).toFixed(1) : '100.0'}%
                </span>
              </div>
            </div>
            
            {/* Compact Breakdown */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-2 space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Gross Revenue</span>
                <span className="text-emerald-500 font-semibold">KSH {stats?.todayNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Returns</span>
                <span className="text-red-500">-KSH {stats?.todayReturns?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Business Expenses</span>
                <span className="text-red-500">-KSH {stats?.todayExpenses?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Personal Expenses</span>
                <span className="text-red-500">-KSH 0.00</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-[var(--border-color)]">
                <span className="text-[var(--text-primary)]">Net Revenue (All)</span>
                <span className="text-emerald-500">KSH {((stats?.todayNetRevenue || 0) - (stats?.todayReturns || 0) - (stats?.todayExpenses || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Bottom Row - Inventory & Expenses */}
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap={4}>
          {/* Today's Expenses */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">
                {dateRange === 'today' ? "Today's Expenses" :
                 dateRange === 'yesterday' ? "Yesterday's Expenses" :
                 'Expenses'}
              </p>
              <span className="text-lg sm:text-xl flex-shrink-0">📉</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-500 mb-2 break-words">
              KSH {stats?.todayExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {stats?.todayExpenses === 0 ? 'No expenses recorded' : 'Total expenses for selected period'}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => router.push('/expenses')}
                className="flex-1 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-xs hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] min-h-[36px]"
              >
                ➕ Add
              </button>
              <button
                onClick={() => router.push('/expenses')}
                className="flex-1 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-xs hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] min-h-[36px]"
              >
                👁 View
              </button>
            </div>
          </ResponsiveCard>

          {/* Total Inventory Value (Cost) */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">Total Inventory Value (Cost)</p>
              <span className="text-lg sm:text-xl flex-shrink-0">💼</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-500 mb-2 break-words">
              KSH {stats?.inventoryValueCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Current value at buying price
            </p>
          </ResponsiveCard>

          {/* Total Inventory Value (Selling) */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">Total Inventory Value (Selling)</p>
              <span className="text-lg sm:text-xl flex-shrink-0">💎</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-500 mb-2 break-words">
              KSH {stats?.inventoryValueSelling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Current value at {priceType} price
            </p>
          </ResponsiveCard>

          {/* Total Units in Stock */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Total Units in Stock</p>
              <span className="text-lg sm:text-xl flex-shrink-0">📦</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-500 mb-2 break-words">
              {stats?.totalUnits.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Total units for all products
            </p>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Additional Metrics Row - 3 columns only */}
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3 }} gap={4}>
          {/* Product Categories */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Product Categories</p>
              <span className="text-lg sm:text-xl flex-shrink-0">📂</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-2">
              {stats?.productCategories || 0}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Number of unique active categories
            </p>
          </ResponsiveCard>

          {/* Outstanding Debt */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Outstanding Debt</p>
              <span className="text-lg sm:text-xl flex-shrink-0">💳</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-500 mb-2 break-words">
              KSH {stats?.outstandingDebt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Total outstanding customer debt
            </p>
          </ResponsiveCard>

          {/* Low Stock Alerts */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Low Stock Alerts</p>
              <span className="text-lg sm:text-xl flex-shrink-0">⚠️</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-500 mb-2">
              {stats?.lowStockCount || 0}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Items below minimum stock
            </p>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Sales & Profit Trend Chart + Pricing Data Audit - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Sales & Profit Trend Chart - Takes 2 columns (66%) */}
          <ResponsiveCard padding="default" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Sales & Profit Trend</h2>
            </div>

            {/* Chart Area - with horizontal scroll on mobile */}
            <div className="relative bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] p-2 sm:p-4 overflow-x-auto" style={{ height: '280px' }}>
              {renderChart()}
            </div>

            {/* Legend - Responsive */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 flex-shrink-0"></div>
                <span className="text-[var(--text-secondary)]">Gross Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 flex-shrink-0"></div>
                <span className="text-[var(--text-secondary)]">Net Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-500 flex-shrink-0"></div>
                <span className="text-[var(--text-secondary)]">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-400 flex-shrink-0"></div>
                <span className="text-[var(--text-secondary)]">Verified Profit</span>
              </div>
            </div>
          </ResponsiveCard>

          {/* Pricing Data Audit - Takes 1 column (33%) */}
          <ResponsiveCard padding="default">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Pricing Data Audit</p>
                <span className="text-lg sm:text-xl">⚠️</span>
              </div>
              <button
                onClick={() => {
                  if (!showPricingProducts) {
                    fetchPricingProducts();
                    setCurrentPage(1);
                  }
                  setShowPricingProducts(!showPricingProducts);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                title={showPricingProducts ? "Hide products" : "View products with issues"}
              >
                {showPricingProducts ? '👁‍🗨' : '👁'}
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-secondary)]">Total Products:</span>
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm font-semibold text-white">
                  {stats?.pricingAudit?.total || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-secondary)]">Valid Pricing:</span>
                <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm font-semibold text-[var(--text-primary)]">
                  {stats?.pricingAudit?.valid || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-secondary)]">Issues Found:</span>
                <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-semibold text-white">
                  {stats?.pricingAudit?.issues || 0}
                </span>
              </div>
            </div>

            {stats?.pricingAudit?.issueDetails && (
              <div className="mt-4 bg-[#FFF8E7] dark:bg-amber-900/20 border border-yellow-600/40 rounded-lg p-3">
                <p className="text-sm font-bold text-[#B8733E] dark:text-orange-400 mb-2">Issues Found:</p>
                <ul className="space-y-1.5 text-xs text-[#B8733E] dark:text-orange-400">
                  {stats.pricingAudit.issueDetails.missingCost > 0 && (
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>{stats.pricingAudit.issueDetails.missingCost} products missing cost price</span>
                    </li>
                  )}
                  {stats.pricingAudit.issueDetails.zeroSellingPrice > 0 && (
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>{stats.pricingAudit.issueDetails.zeroSellingPrice} products with zero selling price</span>
                    </li>
                  )}
                  {stats.pricingAudit.issueDetails.sellingBelowCost > 0 && (
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>{stats.pricingAudit.issueDetails.sellingBelowCost} products selling below cost</span>
                    </li>
                  )}
                  {stats.pricingAudit.issueDetails.unrealisticMarkup > 0 && (
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>{stats.pricingAudit.issueDetails.unrealisticMarkup} products with unrealistic markup</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {showPricingProducts && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Products with Issues</h3>
                {loadingProducts ? (
                  <div className="text-center py-4 text-[var(--text-secondary)] text-sm">Loading products...</div>
                ) : pricingProducts.length === 0 ? (
                  <div className="text-center py-4 text-[var(--text-secondary)] text-sm">No products with issues found</div>
                ) : (
                  <>
                    <div className="overflow-x-auto bg-[#0a1628] rounded-lg border border-[var(--border-color)] -mx-2 sm:mx-0">
                      <table className="w-full text-xs min-w-[600px]">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 px-2 sm:px-3 text-gray-400 font-normal">Product</th>
                            <th className="text-left py-2 px-2 sm:px-3 text-gray-400 font-normal">Cost</th>
                            <th className="text-left py-2 px-2 sm:px-3 text-gray-400 font-normal">Retail</th>
                            <th className="text-left py-2 px-2 sm:px-3 text-gray-400 font-normal">Wholesale</th>
                            <th className="text-left py-2 px-2 sm:px-3 text-gray-400 font-normal">Issues</th>
                            <th className="text-right py-2 px-2 sm:px-3 text-gray-400 font-normal">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage).map((product: any, index: number) => (
                            <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                              <td className="py-3 px-2 sm:px-3 text-gray-200">{product.name}</td>
                              <td className="py-3 px-2 sm:px-3 text-gray-200">
                                {parseFloat(product.cost_price || 0).toFixed(0)}
                              </td>
                              <td className="py-3 px-2 sm:px-3 text-gray-200">
                                {parseFloat(product.retail_price || 0).toFixed(0)}
                              </td>
                              <td className="py-3 px-2 sm:px-3 text-gray-200">
                                {parseFloat(product.wholesale_price || 0).toFixed(0)}
                              </td>
                              <td className="py-3 px-2 sm:px-3">
                                <div className="flex flex-wrap gap-1">
                                  {product.issues?.map((issue: string, idx: number) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-red-600 text-white text-xs rounded">
                                      {issue}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-2 sm:px-3">
                                <div className="flex justify-end gap-1">
                                  <button className="p-1.5 hover:bg-gray-800 rounded min-h-[36px] min-w-[36px] flex items-center justify-center" title="Edit">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-800 rounded min-h-[36px] min-w-[36px] flex items-center justify-center" title="Delete">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {pricingProducts.length > productsPerPage && (
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <div className="text-gray-400">
                          {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, pricingProducts.length)} of {pricingProducts.length}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-xs text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                          >
                            Prev
                          </button>
                          <span className="px-2 py-2 text-[var(--text-secondary)] flex items-center">
                            {currentPage}/{Math.ceil(pricingProducts.length / productsPerPage)}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(pricingProducts.length / productsPerPage), prev + 1))}
                            disabled={currentPage >= Math.ceil(pricingProducts.length / productsPerPage)}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-xs text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </ResponsiveCard>
        </div>
      </div>
    </div>
  );
}
