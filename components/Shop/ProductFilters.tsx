import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface ProductFiltersProps {
  tenantSlug: string;
  categories: string[];
  priceRange: { min: number; max: number };
  onFilterChange: (filters: ActiveFilters) => void;
  activeFilters: ActiveFilters;
  primaryColor: string;
  totalProducts: number;
}

export interface ActiveFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
}

export default function ProductFilters({
  tenantSlug,
  categories,
  priceRange,
  onFilterChange,
  activeFilters,
  primaryColor,
  totalProducts,
}: ProductFiltersProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ActiveFilters>(activeFilters);
  const [priceMin, setPriceMin] = useState(activeFilters.minPrice || priceRange.min);
  const [priceMax, setPriceMax] = useState(activeFilters.maxPrice || priceRange.max);

  // Common sizes
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

  // Update URL with filter parameters
  const updateURL = (filters: ActiveFilters) => {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== 'All') {
      params.set('category', filters.category);
    }
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.colors && filters.colors.length > 0) {
      params.set('colors', filters.colors.join(','));
    }
    if (filters.sizes && filters.sizes.length > 0) {
      params.set('sizes', filters.sizes.join(','));
    }
    if (filters.inStock) params.set('inStock', 'true');

    const queryString = params.toString();
    const newUrl = queryString 
      ? `/shop/${tenantSlug}?${queryString}`
      : `/shop/${tenantSlug}`;
    
    router.push(newUrl, undefined, { shallow: true });
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      ...localFilters,
      minPrice: priceMin !== priceRange.min ? priceMin : undefined,
      maxPrice: priceMax !== priceRange.max ? priceMax : undefined,
    };
    
    onFilterChange(filters);
    updateURL(filters);
    setIsOpen(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters: ActiveFilters = {};
    setLocalFilters(emptyFilters);
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
    onFilterChange(emptyFilters);
    router.push(`/shop/${tenantSlug}`, undefined, { shallow: true });
  };

  // Remove single filter
  const removeFilter = (filterType: keyof ActiveFilters, value?: string) => {
    const newFilters = { ...localFilters };
    
    if (filterType === 'sizes' && value) {
      newFilters.sizes = newFilters.sizes?.filter(s => s !== value);
      if (newFilters.sizes?.length === 0) delete newFilters.sizes;
    } else if (filterType === 'minPrice' || filterType === 'maxPrice') {
      delete newFilters[filterType];
      if (filterType === 'minPrice') setPriceMin(priceRange.min);
      if (filterType === 'maxPrice') setPriceMax(priceRange.max);
    } else {
      delete newFilters[filterType];
    }
    
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
    updateURL(newFilters);
  };

  // Toggle size selection
  const toggleSize = (size: string) => {
    const sizes = localFilters.sizes || [];
    const newSizes = sizes.includes(size)
      ? sizes.filter(s => s !== size)
      : [...sizes, size];
    
    setLocalFilters({ ...localFilters, sizes: newSizes.length > 0 ? newSizes : undefined });
  };

  // Count active filters
  const activeFilterCount = 
    (localFilters.category && localFilters.category !== 'All' ? 1 : 0) +
    (localFilters.minPrice || localFilters.maxPrice ? 1 : 0) +
    (localFilters.sizes?.length || 0) +
    (localFilters.inStock ? 1 : 0);

  return (
    <>
      {/* Filter Button - Mobile/Tablet */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-xl font-semibold text-gray-900 shadow-sm hover:shadow-md transition-all"
          style={{ borderColor: primaryColor }}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span 
                className="px-2 py-0.5 rounded-full text-xs text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {activeFilterCount}
              </span>
            )}
          </span>
          <svg 
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`
        ${isOpen ? 'block' : 'hidden'} lg:block
        bg-white rounded-xl border border-gray-200 p-6 shadow-lg
        mb-6
      `}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Active Filters</p>
            <div className="flex flex-wrap gap-2">
              {localFilters.category && localFilters.category !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {localFilters.category}
                  <button
                    onClick={() => removeFilter('category')}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {(localFilters.minPrice || localFilters.maxPrice) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  KES {localFilters.minPrice || priceRange.min} - {localFilters.maxPrice || priceRange.max}
                  <button
                    onClick={() => {
                      removeFilter('minPrice');
                      removeFilter('maxPrice');
                    }}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {localFilters.sizes?.map(size => (
                <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {size}
                  <button
                    onClick={() => removeFilter('sizes', size)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
              {localFilters.inStock && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  In Stock Only
                  <button
                    onClick={() => removeFilter('inStock')}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price Range Filter */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Min Price</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                min={priceRange.min}
                max={priceMax}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Max Price</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                min={priceMin}
                max={priceRange.max}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>KES {priceRange.min.toLocaleString()}</span>
              <span>KES {priceRange.max.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Size Filter */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Sizes</h4>
          <div className="grid grid-cols-4 gap-2">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`
                  px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all
                  ${localFilters.sizes?.includes(size)
                    ? 'text-white'
                    : 'bg-white text-gray-700 hover:border-gray-400'
                  }
                `}
                style={localFilters.sizes?.includes(size) ? {
                  backgroundColor: primaryColor,
                  borderColor: primaryColor
                } : {
                  borderColor: '#E5E7EB'
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* In Stock Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localFilters.inStock || false}
              onChange={(e) => setLocalFilters({ ...localFilters, inStock: e.target.checked || undefined })}
              className="w-5 h-5 cursor-pointer"
              style={{ accentColor: primaryColor }}
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              Show in-stock items only
            </span>
          </label>
        </div>

        {/* Apply Button */}
        <button
          onClick={applyFilters}
          className="w-full py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          Apply Filters ({totalProducts} items)
        </button>
      </div>
    </>
  );
}
