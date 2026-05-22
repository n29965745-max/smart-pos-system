# Mobile Responsive Fixes - Action Plan

## Issues to Fix:

### 1. Duplicate Page Titles
**Problem:** TopBar shows title AND pages have their own h1 titles
**Solution:** Remove h1 titles from ALL pages since TopBar already displays them
**Pages to fix:**
- transactions.tsx
- returns.tsx  
- expenses.tsx
- product-performance.tsx
- inventory-analytics.tsx
- sales-analytics.tsx
- settings.tsx
- All other pages with duplicate titles

### 2. "All" Filter Not Displaying
**Problem:** Filter tabs (All, Completed, Pending, etc.) not showing on mobile
**Solution:** Fix the filter layout to show "All" filter properly
**Pages affected:**
- transactions.tsx
- returns.tsx
- expenses.tsx

### 3. Compact Filter Layout
**Problem:** Filters are stacking vertically, taking too much space
**Solution:** Make "All" dropdown and date range display horizontally in one compact line
**Target layout:** `[All ▼] [📅 dd/mm/yyyy] to [📅 dd/mm/yyyy] [Export]`
**Pages to update:**
- transactions.tsx
- returns.tsx
- expenses.tsx
- product-performance.tsx
- inventory-analytics.tsx
- sales-analytics.tsx

### 4. Settings Themes Section
**Problem:** Current implementation doesn't match the card-based design shown in screenshot
**Solution:** Revert to horizontal card layout with Light/Dark theme cards side by side
**File:** pages/settings.tsx

### 5. Remove Unused Imports
**Problem:** ResponsiveGrid, ResponsiveCard, ResponsiveFilters still imported
**Solution:** Remove these imports from all pages
**Pages to clean:**
- transactions.tsx
- returns.tsx
- expenses.tsx
- All pages with these imports

## Implementation Order:
1. Fix Settings themes section first (most visible)
2. Remove duplicate titles from all pages
3. Fix filter layouts to be compact and horizontal
4. Remove unused imports
5. Test on mobile to verify all fixes
