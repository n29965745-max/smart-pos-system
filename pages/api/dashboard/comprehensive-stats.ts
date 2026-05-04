import type { NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-client';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

function getDateRange(range: string): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case 'today': return { startDate: today, endDate: now };
    case 'yesterday': {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return { startDate: y, endDate: today };
    }
    case 'last7days': {
      const d = new Date(today); d.setDate(d.getDate() - 7);
      return { startDate: d, endDate: now };
    }
    case 'last30days': {
      const d = new Date(today); d.setDate(d.getDate() - 30);
      return { startDate: d, endDate: now };
    }
    case 'thisMonth': return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now };
    case 'lastMonth': return {
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth(), 0)
    };
    case 'thisYear': return { startDate: new Date(now.getFullYear(), 0, 1), endDate: now };
    default: return { startDate: null, endDate: null };
  }
}

export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tenantId } = req.auth;
    const priceType = (req.query.priceType as string) || 'all'; // all, retail, wholesale
    const clientDate = req.query.clientDate as string;
    
    // Log current server time for debugging
    const serverTime = new Date();
    const serverDateStr = serverTime.toISOString();
    const serverLocalDate = serverTime.toDateString();
    
    console.log('=== DASHBOARD API CALLED ===');
    console.log('Server time (ISO):', serverDateStr);
    console.log('Server time (local string):', serverLocalDate);
    console.log('Client date:', clientDate);
    console.log('Date range requested:', range);
    console.log('Price type requested:', priceType);
    console.log('Query params:', req.query);
    
    const { startDate, endDate } = getDateRange(range);
    
    console.log('Start date:', startDate?.toISOString());
    console.log('End date:', endDate?.toISOString());

    // Get today's date range in EAT timezone (UTC+3)
    // We need to query the database using UTC timestamps that correspond to "today" in EAT
    const now = new Date();
    
    // Get today's date at midnight in local timezone
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    
    // Convert to ISO string for database query (this will be in UTC)
    const todayUTC = todayLocal.toISOString();
    const tomorrowUTC = tomorrowLocal.toISOString();
    
    console.log('Today (local midnight):', todayLocal.toString());
    console.log('Today (UTC for query):', todayUTC);
    console.log('Tomorrow (UTC for query):', tomorrowUTC);

    // Fetch all products for inventory calculations — scoped to tenant
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId);

    if (productsError) throw productsError;

    // Calculate inventory values based on price type (retail or wholesale only)
    const inventoryValueCost = products?.reduce((sum, p) => {
      const cost = parseFloat(p.cost_price) || 0;
      const qty = p.stock_quantity || 0;
      return sum + (cost * qty);
    }, 0) || 0;

    let inventoryValueSelling = 0;
    if (priceType === 'retail') {
      inventoryValueSelling = products?.reduce((sum, p) => {
        const price = parseFloat(p.retail_price) || 0;
        const qty = p.stock_quantity || 0;
        return sum + (price * qty);
      }, 0) || 0;
    } else if (priceType === 'wholesale') {
      inventoryValueSelling = products?.reduce((sum, p) => {
        const price = parseFloat(p.wholesale_price) || 0;
        const qty = p.stock_quantity || 0;
        return sum + (price * qty);
      }, 0) || 0;
    }

    const totalUnits = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;

    // Potential profit (if all inventory sold at selected price type)
    const potentialProfit = inventoryValueSelling - inventoryValueCost;

    // Fetch all transactions for all-time profit (or filtered by date range)
    let allTransactionsQuery = supabaseAdmin.from('transactions').select('*').eq('tenant_id', tenantId);
    
    if (startDate && endDate) {
      allTransactionsQuery = allTransactionsQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    const { data: allTransactions, error: allTxnError } = await allTransactionsQuery;

    if (allTxnError) throw allTxnError;

    // Calculate actual profit by fetching transaction items and comparing with cost prices
    let allTimeProfit = 0;
    let retailRevenue = 0;
    let wholesaleRevenue = 0;
    let retailProfit = 0;
    let wholesaleProfit = 0;
    let retailSales = 0;
    let wholesaleSales = 0;
    
    if (allTransactions && allTransactions.length > 0) {
      // Use transaction_id (TEXT) not id (UUID) for joining with transaction_items
      const transactionIds = allTransactions.map(t => t.transaction_id);
      
      // Fetch all transaction items for these transactions
      const { data: transactionItems, error: itemsError } = await supabaseAdmin
        .from('transaction_items')
        .select('product_id, quantity, unit_price, transaction_id')
        .eq('tenant_id', tenantId)
        .in('transaction_id', transactionIds);

      if (transactionItems && transactionItems.length > 0) {
        // Create a map of product IDs to cost prices for faster lookup
        const productCostMap = new Map();
        const productRetailMap = new Map();
        const productWholesaleMap = new Map();
        products?.forEach(p => {
          productCostMap.set(p.id, parseFloat(p.cost_price) || 0);
          productRetailMap.set(p.id, parseFloat(p.retail_price) || 0);
          productWholesaleMap.set(p.id, parseFloat(p.wholesale_price) || 0);
        });

        // Calculate profit for each item and determine retail/wholesale based on price
        for (const item of transactionItems) {
          const costPrice = productCostMap.get(item.product_id) || 0;
          const sellingPrice = parseFloat(item.unit_price) || 0;
          const quantity = item.quantity || 0;
          const itemProfit = (sellingPrice - costPrice) * quantity;
          const itemRevenue = sellingPrice * quantity;
          
          // Only count profit if cost price exists and is valid
          if (costPrice > 0 && sellingPrice > 0) {
            allTimeProfit += itemProfit;
          }
          
          // Determine if retail or wholesale based on which price it matches
          const retailPrice = productRetailMap.get(item.product_id) || 0;
          const wholesalePrice = productWholesaleMap.get(item.product_id) || 0;
          
          // Check which price the selling price is closer to
          const retailDiff = Math.abs(sellingPrice - retailPrice);
          const wholesaleDiff = Math.abs(sellingPrice - wholesalePrice);
          
          if (retailDiff < wholesaleDiff || wholesalePrice === 0) {
            // It's a retail sale
            retailRevenue += itemRevenue;
            if (costPrice > 0 && sellingPrice > 0) {
              retailProfit += itemProfit;
            }
          } else {
            // It's a wholesale sale
            wholesaleRevenue += itemRevenue;
            if (costPrice > 0 && sellingPrice > 0) {
              wholesaleProfit += itemProfit;
            }
          }
        }
        
        // Count unique transactions by determining retail/wholesale for each transaction
        const transactionTypes = new Map();
        for (const item of transactionItems) {
          const sellingPrice = parseFloat(item.unit_price) || 0;
          const retailPrice = productRetailMap.get(item.product_id) || 0;
          const wholesalePrice = productWholesaleMap.get(item.product_id) || 0;
          
          const retailDiff = Math.abs(sellingPrice - retailPrice);
          const wholesaleDiff = Math.abs(sellingPrice - wholesalePrice);
          
          if (!transactionTypes.has(item.transaction_id)) {
            if (retailDiff < wholesaleDiff || wholesalePrice === 0) {
              transactionTypes.set(item.transaction_id, 'retail');
            } else {
              transactionTypes.set(item.transaction_id, 'wholesale');
            }
          }
        }
        
        retailSales = Array.from(transactionTypes.values()).filter(t => t === 'retail').length;
        wholesaleSales = Array.from(transactionTypes.values()).filter(t => t === 'wholesale').length;
      }
    }

    // Calculate gross revenue based on filtered items
    const grossRevenue = retailRevenue + wholesaleRevenue;

    // Fetch transactions for the selected date range (not just today)
    // This will be used for "Today's Net Revenue" or "Yesterday's Net Revenue" etc.
    let rangeTransactions;
    let rangeTransactionsQuery = supabaseAdmin.from('transactions').select('*').eq('tenant_id', tenantId);
    
    if (startDate && endDate) {
      // Use the selected date range
      rangeTransactionsQuery = rangeTransactionsQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    } else {
      // Default to today if no range specified
      rangeTransactionsQuery = rangeTransactionsQuery
        .gte('created_at', todayUTC)
        .lt('created_at', tomorrowUTC);
    }
    
    const { data: rangeTransactionsData, error: rangeTxnError } = await rangeTransactionsQuery;

    if (rangeTxnError) throw rangeTxnError;

    // Calculate net revenue for the selected range
    const rangeNetRevenue = rangeTransactionsData?.reduce((sum, t) => {
      return sum + (parseFloat(t.total_amount) || 0);
    }, 0) || 0;
    
    // ALWAYS fetch today's transactions for the Net Revenue breakdown
    const { data: todayTransactionsData, error: todayTxnError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', todayUTC)
      .lt('created_at', tomorrowUTC);

    if (todayTxnError) throw todayTxnError;

    // Calculate today's gross revenue for the breakdown
    let todayGrossRevenue = 0;
    if (todayTransactionsData && todayTransactionsData.length > 0) {
      const todayTransactionIds = todayTransactionsData.map(t => t.id);
      
      // Fetch today's transaction items
      const { data: todayItems } = await supabase
        .from('transaction_items')
        .select('unit_price, quantity')
        .in('transaction_id', todayTransactionIds);

      if (todayItems) {
        todayGrossRevenue = todayItems.reduce((sum, item) => {
          return sum + (parseFloat(item.unit_price) * item.quantity);
        }, 0);
      }
    }
    
    console.log('=== RANGE SALES CALCULATION ===');
    console.log('Range UTC:', startDate?.toISOString() || todayUTC, 'to', endDate?.toISOString() || tomorrowUTC);
    console.log('Range transactions found:', rangeTransactionsData?.length || 0);
    console.log('Range net revenue:', rangeNetRevenue);
    console.log('Today gross revenue (for breakdown):', todayGrossRevenue);
    if (rangeTransactionsData && rangeTransactionsData.length > 0) {
      console.log('Sample transaction:', rangeTransactionsData[0]);
    }

    // Fetch expenses for the selected date range
    let rangeExpenses = 0;
    let todayExpensesOnly = 0;
    try {
      let expensesQuery = supabase
        .from('expenses')
        .select('amount, expense_date, status')
        .eq('status', 'Approved'); // Only count approved expenses
      
      if (startDate && endDate) {
        expensesQuery = expensesQuery
          .gte('expense_date', startDate.toISOString().split('T')[0])
          .lte('expense_date', endDate.toISOString().split('T')[0]);
      } else {
        // Default to today if no range specified
        const todayDateStr = todayLocal.toISOString().split('T')[0];
        expensesQuery = expensesQuery.eq('expense_date', todayDateStr);
      }
      
      const { data: expenses } = await expensesQuery;
      rangeExpenses = expenses?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
      
      // ALWAYS fetch today's expenses for the breakdown
      const todayDateStr = todayLocal.toISOString().split('T')[0];
      const { data: todayExpensesData } = await supabase
        .from('expenses')
        .select('amount, expense_date, status')
        .eq('status', 'Approved')
        .eq('expense_date', todayDateStr);
      
      todayExpensesOnly = todayExpensesData?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
    } catch (e) {
      // Expenses table might not exist
      rangeExpenses = 0;
      todayExpensesOnly = 0;
    }

    // Fetch returns for the selected date range
    let rangeReturns = 0;
    try {
      let returnsQuery = supabase
        .from('returns')
        .select('amount, return_date, status')
        .in('status', ['Completed', 'Approved']); // Only count completed/approved returns
      
      if (startDate && endDate) {
        returnsQuery = returnsQuery
          .gte('return_date', startDate.toISOString())
          .lte('return_date', endDate.toISOString());
      } else {
        // Default to today if no range specified
        returnsQuery = returnsQuery
          .gte('return_date', todayUTC)
          .lt('return_date', tomorrowUTC);
      }
      
      const { data: returns } = await returnsQuery;
      rangeReturns = returns?.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || 0;
      
      console.log('=== RETURNS CALCULATION ===');
      console.log('Range returns found:', returns?.length || 0);
      console.log('Range returns amount:', rangeReturns);
    } catch (e) {
      console.error('Error fetching returns:', e);
      rangeReturns = 0;
    }

    // Count product categories
    const categories = new Set(products?.map(p => p.category).filter(Boolean));
    const productCategories = categories.size;

    // Count low stock items
    const lowStockCount = products?.filter(p => 
      p.stock_quantity <= (p.minimum_stock_level || 10)
    ).length || 0;

    // Fetch outstanding debt (Outstanding + Partial statuses)
    let outstandingDebt = 0;
    try {
      const { data: debts } = await supabase
        .from('debts')
        .select('amount_remaining, status')
        .in('status', ['Outstanding', 'Partial']);
      
      outstandingDebt = debts?.reduce((sum, d) => sum + (parseFloat(d.amount_remaining) || 0), 0) || 0;
    } catch (e) {
      console.error('Error fetching debts:', e);
      outstandingDebt = 0;
    }

    // Pricing audit - use same logic as pricing-audit API
    const totalProducts = products?.length || 0;
    let pricingIssues = 0;
    let missingCost = 0;
    let zeroSellingPrice = 0;
    let sellingBelowCost = 0;
    let unrealisticMarkup = 0;
    
    products?.forEach(product => {
      const costPrice = parseFloat(product.cost_price) || 0;
      const retailPrice = parseFloat(product.retail_price) || 0;
      const wholesalePrice = parseFloat(product.wholesale_price) || 0;
      
      let hasIssue = false;

      // Check 1: Missing cost price
      if (costPrice === 0 || !product.cost_price) {
        hasIssue = true;
        missingCost++;
      }

      // Check 2: Zero selling price (both retail and wholesale)
      if (!hasIssue && (retailPrice === 0 || !product.retail_price) && (wholesalePrice === 0 || !product.wholesale_price)) {
        hasIssue = true;
        zeroSellingPrice++;
      }

      // Check 3: Selling below cost (retail)
      if (!hasIssue && costPrice > 0 && retailPrice > 0 && retailPrice < costPrice) {
        hasIssue = true;
        sellingBelowCost++;
      }

      // Check 4: Selling below cost (wholesale)
      if (!hasIssue && costPrice > 0 && wholesalePrice > 0 && wholesalePrice < costPrice) {
        hasIssue = true;
        sellingBelowCost++;
      }

      // Check 5: Unrealistic markup (>500%)
      if (!hasIssue && costPrice > 0 && retailPrice > 0) {
        const markup = ((retailPrice - costPrice) / costPrice) * 100;
        if (markup > 500) {
          hasIssue = true;
          unrealisticMarkup++;
        }
      }

      if (hasIssue) {
        pricingIssues++;
      }
    });

    const validPricing = totalProducts - pricingIssues;

    // Get sales trend data (based on date range or all time)
    let trendStartDate: Date;
    if (startDate) {
      trendStartDate = startDate;
    } else {
      // For 'all' range, get from first transaction ever
      trendStartDate = new Date('2000-01-01');
    }

    const trendEndDate = endDate || new Date();

    const { data: trendTransactions, error: trendError } = await supabase
      .from('transactions')
      .select('created_at, total_amount')
      .gte('created_at', trendStartDate.toISOString())
      .lte('created_at', trendEndDate.toISOString())
      .order('created_at', { ascending: true });

    if (trendError) console.error('Trend error:', trendError);

    // Prepare chart data
    let chartData: Array<{ date: string; gross: number; net: number; expenses: number; profit: number }> = [];

    if (trendTransactions && trendTransactions.length > 0) {
      // Fetch transactions with IDs for chart - use transaction_id (TEXT) not id (UUID)
      const { data: trendTransactionsWithIds } = await supabase
        .from('transactions')
        .select('id, transaction_id, created_at, total_amount')
        .gte('created_at', trendStartDate.toISOString())
        .lte('created_at', trendEndDate.toISOString())
        .order('created_at', { ascending: true });

      const transactionIdsForChart = trendTransactionsWithIds?.map(t => t.transaction_id) || [];

      if (transactionIdsForChart.length > 0) {
        // Fetch transaction items
        const { data: trendItems } = await supabase
          .from('transaction_items')
          .select('transaction_id, product_id, quantity, unit_price')
          .in('transaction_id', transactionIdsForChart);

        // Create a map of product IDs to cost prices
        const productCostMap = new Map();
        products?.forEach(p => {
          productCostMap.set(p.id, parseFloat(p.cost_price) || 0);
        });

        // Create a map of transaction_id to profit
        const profitByTransaction: { [key: string]: number } = {};
        
        if (trendItems) {
          for (const item of trendItems) {
            const costPrice = productCostMap.get(item.product_id) || 0;
            const sellingPrice = parseFloat(item.unit_price) || 0;
            const quantity = item.quantity || 0;
            
            // Only calculate profit if cost price exists and is valid
            const itemProfit = (costPrice > 0 && sellingPrice > 0) ? (sellingPrice - costPrice) * quantity : 0;
            
            if (!profitByTransaction[item.transaction_id]) {
              profitByTransaction[item.transaction_id] = 0;
            }
            profitByTransaction[item.transaction_id] += itemProfit;
          }
        }

        // Fetch expenses for the trend period
        let trendExpenses: any[] = [];
        try {
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount, expense_date, status')
            .eq('status', 'Approved') // Only approved expenses
            .gte('expense_date', trendStartDate.toISOString().split('T')[0])
            .lte('expense_date', trendEndDate.toISOString().split('T')[0]);
          
          trendExpenses = expensesData || [];
        } catch (e) {
          trendExpenses = [];
        }

        // Group transactions by date with actual profit
        const salesByDate: { [key: string]: { gross: number; net: number; expenses: number; profit: number; timestamp: number } } = {};
        
        trendTransactionsWithIds?.forEach(t => {
          const dateObj = new Date(t.created_at);
          const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!salesByDate[date]) {
            salesByDate[date] = { gross: 0, net: 0, expenses: 0, profit: 0, timestamp: dateObj.getTime() };
          }
          const total = parseFloat(t.total_amount) || 0;
          const profit = profitByTransaction[t.id] || 0;
          
          salesByDate[date].gross += total;
          salesByDate[date].net += total; // Use total_amount for net as well
          salesByDate[date].profit += profit;
        });

        // Add expenses by date
        trendExpenses.forEach(e => {
          const dateObj = new Date(e.expense_date + 'T00:00:00'); // Use expense_date instead of created_at
          const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!salesByDate[date]) {
            salesByDate[date] = { gross: 0, net: 0, expenses: 0, profit: 0, timestamp: dateObj.getTime() };
          }
          salesByDate[date].expenses += parseFloat(e.amount) || 0;
        });

        // Convert to array and sort by timestamp - get ALL data points for full trend visibility
        chartData = Object.entries(salesByDate)
          .map(([date, values]) => ({ date, ...values }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(({ timestamp, ...rest }) => rest);
        
        console.log('=== CHART DATA GENERATED ===');
        console.log('Total data points:', chartData.length);
        console.log('Sales by date:', salesByDate);
        console.log('Final chart data:', JSON.stringify(chartData, null, 2));
      }
    }

    // Send response
    res.status(200).json({
      success: true,
      serverTime: new Date().toISOString(),
      data: {
        allTimeProfit,
        potentialProfit,
        grossRevenue,
        todayNetRevenue: rangeNetRevenue,
        todayExpenses: rangeExpenses,
        todayReturns: rangeReturns, // Returns for the selected date range
        todayGrossRevenue, // For the breakdown in Net Revenue card
        todayExpensesOnly, // For the breakdown in Net Revenue card
        inventoryValueCost,
        inventoryValueSelling,
        totalUnits,
        retailRevenue,
        wholesaleRevenue,
        retailProfit,
        wholesaleProfit,
        retailSales,
        wholesaleSales,
        productCategories,
        outstandingDebt,
        lowStockCount,
        pricingAudit: {
          total: totalProducts,
          valid: validPricing,
          issues: pricingIssues,
          issueDetails: {
            missingCost,
            zeroSellingPrice,
            sellingBelowCost,
            unrealisticMarkup
          }
        },
        chartData
      }
    });
  } catch (error: any) {
    console.error('Comprehensive stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        allTimeProfit: 0,
        potentialProfit: 0,
        grossRevenue: 0,
        todayNetRevenue: 0,
        todayExpenses: 0,
        todayReturns: 0,
        inventoryValueCost: 0,
        inventoryValueSelling: 0,
        totalUnits: 0,
        retailRevenue: 0,
        wholesaleRevenue: 0,
        retailSales: 0,
        wholesaleSales: 0,
        productCategories: 0,
        outstandingDebt: 0,
        lowStockCount: 0,
        pricingAudit: {
          total: 0,
          valid: 0,
          issues: 0,
          issueDetails: {
            missingCost: 0,
            zeroSellingPrice: 0,
            sellingBelowCost: 0,
            unrealisticMarkup: 0
          }
        },
        chartData: []
      }
    });
  }
}
