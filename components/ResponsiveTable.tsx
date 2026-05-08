import React, { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive Table Wrapper
 * Adds horizontal scroll on mobile while maintaining full width on desktop
 */
export default function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="inline-block min-w-full align-middle">
        <div className={`overflow-hidden ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive Table with scroll indicators
 */
export function ResponsiveTableWithIndicators({ children, className = '' }: ResponsiveTableProps) {
  const [showLeftShadow, setShowLeftShadow] = React.useState(false);
  const [showRightShadow, setShowRightShadow] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  React.useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  return (
    <div className="relative">
      {/* Left scroll indicator */}
      {showLeftShadow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right scroll indicator */}
      {showRightShadow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10 pointer-events-none" />
      )}
      
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
      >
        <div className="inline-block min-w-full align-middle">
          <div className={`overflow-hidden ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
