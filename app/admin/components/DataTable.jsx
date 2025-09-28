"use client";
import { Loader2, AlertTriangle } from "lucide-react";

export default function DataTable({
  title,
  loading,
  error,
  data,
  columns,
  search,
  onSearchChange,
  filters = [],
  pagination,
  onPageChange,
  children,
}) {
  return (
    <div className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
          {/* Dropdown filters */}
          {filters.map((filter) => (
            <select
              key={filter.label}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Loading/Error/Data */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin w-8 h-8 text-[#1ABA7F]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 text-red-600">
          <AlertTriangle className="w-8 h-8" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                {columns.map((col) => (
                  <th key={col} className="py-2 px-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2 mt-4">
        <button
          className="px-3 py-1 rounded border border-[#1ABA7F]/30 text-[#225F91] disabled:opacity-50"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Prev
        </button>
        <span className="text-sm text-gray-700">
          Page {pagination.page} of {pagination.pages}
        </span>
        <button
          className="px-3 py-1 rounded border border-[#1ABA7F]/30 text-[#225F91] disabled:opacity-50"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
