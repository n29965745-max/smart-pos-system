import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemName?: string; // e.g., "products", "customers", "transactions"
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemName = 'items'
}: PaginationProps) {
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border-color)]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-[var(--text-secondary)] text-center sm:text-left">
            {startItem}-{endItem} of {totalItems} {itemName}
          </div>

          {/* Items per page dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-[var(--text-secondary)]">Per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="min-h-[36px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-2 py-1 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="min-h-[36px] px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="px-2 py-1 text-xs sm:text-sm text-[var(--text-secondary)]">
            {currentPage}/{totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="min-h-[36px] px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
