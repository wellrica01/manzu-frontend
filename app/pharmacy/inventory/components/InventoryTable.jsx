'use client';
import React, { useEffect, useState } from 'react';

const sortOptions = [
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'stock_asc', label: 'Stock Low-High' },
  { value: 'stock_desc', label: 'Stock High-Low' },
  { value: 'price_asc', label: 'Price Low-High' },
  { value: 'price_desc', label: 'Price High-Low' },
  { value: 'expiry_asc', label: 'Expiry Soonest' },
  { value: 'expiry_desc', label: 'Expiry Latest' },
];

function StockBadge({ stock }) {
  if (stock <= 5) {
    return <span className="inline-block px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200">Low ({stock})</span>;
  }
  return <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">{stock}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InventoryTable({ onEdit, onDelete, refreshKey }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nameFilter, setNameFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name_asc');

  useEffect(() => {
    async function fetchMedications() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch('http://localhost:5000/api/pharmacy/medications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch medications');
        const data = await res.json();
        setMedications(data.medications || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMedications();
  }, [refreshKey]);

  // Filtering
  let filteredMeds = medications;
  if (nameFilter.trim()) {
    filteredMeds = filteredMeds.filter(med => med.brandName.toLowerCase().includes(nameFilter.trim().toLowerCase()));
  }
  if (lowStockOnly) {
    filteredMeds = filteredMeds.filter(med => med.stock <= 5);
  }
  if (expiringSoonOnly) {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    filteredMeds = filteredMeds.filter(med => med.expiryDate && new Date(med.expiryDate) <= soon && new Date(med.expiryDate) >= now);
  }

  // Sorting
  filteredMeds = [...filteredMeds].sort((a, b) => {
    if (sortBy === 'name_asc') return (a.brandName || '').localeCompare(b.brandName || '');
    if (sortBy === 'name_desc') return (b.brandName || '').localeCompare(a.brandName || '');
    if (sortBy === 'stock_asc') return a.stock - b.stock;
    if (sortBy === 'stock_desc') return b.stock - a.stock;
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'expiry_asc') return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
    if (sortBy === 'expiry_desc') return new Date(b.expiryDate || 0) - new Date(a.expiryDate || 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <table className="min-w-full bg-white rounded-2xl shadow-lg animate-pulse">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Stock</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Expiry Date</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2 flex gap-2">
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (error) return <div className="p-4 text-red-500 bg-white rounded shadow">{error}</div>;

  // Reset filters handler
  function resetFilters() {
    setNameFilter("");
    setLowStockOnly(false);
    setExpiringSoonOnly(false);
  }

  // Determine empty state message
  let emptyMessage = "No medications in inventory.";
  if (lowStockOnly && expiringSoonOnly) {
    emptyMessage = "No medications are low in stock and expiring in the next 30 days.";
  } else if (lowStockOnly) {
    emptyMessage = "No medications are low in stock.";
  } else if (expiringSoonOnly) {
    emptyMessage = "No medications expiring in the next 30 days.";
  } else if (nameFilter.trim()) {
    emptyMessage = "No medications match your search.";
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div>
          <label htmlFor="med-name-filter" className="block text-xs font-medium text-gray-700 mb-1">Search Name</label>
          <input
            id="med-name-filter"
            type="text"
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
            placeholder="e.g. Paracetamol"
          />
        </div>
        <div className="flex items-center gap-2 mt-6 md:mt-0">
          <input
            id="low-stock-only"
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => setLowStockOnly(e.target.checked)}
            className="accent-primary h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="low-stock-only" className="text-sm text-gray-700">Low Stock Only</label>
        </div>
        <div className="flex items-center gap-2 mt-6 md:mt-0">
          <input
            id="expiring-soon-only"
            type="checkbox"
            checked={expiringSoonOnly}
            onChange={e => setExpiringSoonOnly(e.target.checked)}
            className="accent-primary h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="expiring-soon-only" className="text-sm text-gray-700">Expiring in 30 days</label>
        </div>
        <div>
          <label htmlFor="sort-by" className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <table className="min-w-full bg-white rounded-2xl shadow-lg border border-gray-100">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Stock</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Price</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Expiry Date</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMeds.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
                {(lowStockOnly || expiringSoonOnly || nameFilter.trim()) && (
                  <button
                    onClick={resetFilters}
                    className="ml-4 px-3 py-1 rounded bg-primary text-white hover:bg-primary-dark transition"
                  >
                    Reset Filters
                  </button>
                )}
              </td>
            </tr>
          ) : (
            filteredMeds.map((med, idx) => (
              <tr
                key={med.medicationId}
                className={`border-t transition-colors duration-150 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-primary/10 focus-within:bg-primary/20`}
                tabIndex={0}
              >
                <td className="px-4 py-2 font-medium text-gray-800 max-w-[180px] truncate" title={med.brandName}>{med.brandName}</td>
                <td className="px-4 py-2"><StockBadge stock={med.stock} /></td>
                <td className="px-4 py-2 text-gray-700">₦{med.price}</td>
                <td className="px-4 py-2 text-gray-700">{formatDate(med.expiryDate)}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-150 font-semibold shadow-sm"
                    onClick={() => onEdit && onEdit(med)}
                    tabIndex={0}
                    aria-label={`Edit ${med.name}`}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none transition-all duration-150 font-semibold shadow-sm"
                    onClick={() => onDelete && onDelete(med)}
                    tabIndex={0}
                    aria-label={`Delete ${med.name}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 