import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Search, Plus } from "lucide-react";

export default function DataTableView({
  title,
  description,
  data = [],
  loading = false,
  error = null,
  pagination = { page: 1, limit: 10, total: 0, pages: 1 },
  onPageChange,
  
  // Search and filters
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [], // Array of filter objects: { value, onChange, options, placeholder, className }
  
  // Table configuration
  columns = [], // Array of column objects: { key, label, render?, className?, sortable? }
  emptyState = {},
  
  // Mobile card configuration
  mobileCardRender, // Function to render mobile cards
  
  // Actions
  primaryAction = null, // { label, icon, onClick, className }
  refreshAction = null, // { label?, icon?, onClick, className, loading? }

  
  // Additional props
  className = "",
  tableClassName = "",
  showResultsCount = true,
}) {
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Default empty state
  const defaultEmptyState = {
    icon: Search,
    title: `No ${title?.toLowerCase()} found`,
    description: searchValue || filters.some(f => f.value) 
      ? "Try adjusting your search criteria or filters to find what you're looking for."
      : `Get started by adding your first ${title?.toLowerCase()?.slice(0, -1) || 'item'} to the system.`,
    showPrimaryAction: !searchValue && !filters.some(f => f.value),
  };

  const finalEmptyState = { ...defaultEmptyState, ...emptyState };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <finalEmptyState.icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{finalEmptyState.title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {finalEmptyState.description}
      </p>
      {finalEmptyState.showPrimaryAction && primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className={primaryAction.className || "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"}
        >
          {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
          {primaryAction.label}
        </button>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#225F91]">{title}</h1>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
        <div className="flex gap-2">
         {refreshAction && (
            <button
              onClick={refreshAction.onClick}
              disabled={refreshAction.loading}
              className={refreshAction.className || "flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"}
              title={refreshAction.label || "Refresh"}
            >
              {refreshAction.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  {refreshAction.icon && <refreshAction.icon className="w-4 h-4" />}
                  {refreshAction.label || "Refresh"}
                </>
              )}
            </button>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={primaryAction.className || "flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition-colors shadow-sm"}
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {(onSearchChange || filters.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            {onSearchChange && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                />
              </div>
            )}

            {/* Custom Filters */}
            {filters.map((filter, index) => (
              <div key={index} className={filter.className || "sm:w-48"}>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                  aria-label={filter.placeholder}
                >
                  <option value="">{filter.placeholder}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1ABA7F]" />
          <span className="ml-2 text-gray-600">Loading {title?.toLowerCase()}...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Error Loading {title}</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : data.length === 0 ? (
        <EmptyState />
      ) : isMobile && mobileCardRender ? (
        // Mobile view - cards
        <div>
          {showResultsCount && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing {data.length} of {pagination.total} {title?.toLowerCase()}
              </p>
            </div>
          )}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.id || item._id || item.userIdentifier || index}>
            {mobileCardRender(item, index)}
          </div>
        ))}
      </div>

          
          {/* Mobile Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        // Desktop view - table
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`w-full ${tableClassName}`}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, rowIndex) => (
                  <tr key={item.id || rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-4 py-4 ${column.cellClassName || ''}`}
                      >
                        {column.render ? column.render(item, rowIndex) : item[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Desktop Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => onPageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? "z-10 bg-[#1ABA7F] border-[#1ABA7F] text-white"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => onPageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}