import React, { useEffect, useState } from 'react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  shipped: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  ready_for_pickup: 'bg-purple-100 text-purple-800 border-purple-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  default: 'bg-gray-100 text-gray-700 border-gray-300',
};

const statusOptions = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'ready_for_pickup',
  'cancelled',
];

const sortOptions = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'total_desc', label: 'Total High-Low' },
  { value: 'total_asc', label: 'Total Low-High' },
  { value: 'patient_asc', label: 'Patient A-Z' },
  { value: 'patient_desc', label: 'Patient Z-A' },
];

function StatusBadge({ status }) {
  const color = statusColors[status] || statusColors.default;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold capitalize ${color}`}
      title={status}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function OrdersTable({ onViewDetails, refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch('http://localhost:5000/api/pharmacy/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [refreshKey]);

  // Filtering
  let filteredOrders = orders;
  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
  }

  // Sorting
  filteredOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'created_desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'created_asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'total_desc') return (b.totalPrice || 0) - (a.totalPrice || 0);
    if (sortBy === 'total_asc') return (a.totalPrice || 0) - (b.totalPrice || 0);
    if (sortBy === 'patient_asc') return (a.patientIdentifier || '').localeCompare(b.patientIdentifier || '');
    if (sortBy === 'patient_desc') return (b.patientIdentifier || '').localeCompare(a.patientIdentifier || '');
    return 0;
  });

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <table className="min-w-full bg-white rounded-2xl shadow-lg animate-pulse">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="px-4 py-2 text-left">Order ID</th>
              <th className="px-4 py-2 text-left">Patient</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Total (₦)</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                <td className="px-4 py-2"><div className="h-8 w-24 bg-gray-200 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (error) return <div className="p-4 text-red-500 bg-white rounded shadow">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div>
          <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt === 'all' ? 'All Statuses' : opt.replace(/_/g, ' ')}</option>
            ))}
          </select>
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
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Order ID</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Patient</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Total (₦)</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Created</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                {orders.length === 0 ? (
                  'No orders found.'
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    No orders match your filter.
                    <button
                      className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-150 font-semibold"
                      onClick={() => setStatusFilter('all')}
                    >
                      Reset Filters
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ) : (
            filteredOrders.map((order, idx) => (
              <tr
                key={order.id}
                className={`border-t transition-colors duration-150 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-primary/10 focus-within:bg-primary/20`}
                tabIndex={0}
              >
                <td className="px-4 py-2 font-medium text-gray-800">{order.id}</td>
                <td className="px-4 py-2 text-gray-700 max-w-[120px] truncate" title={order.patientIdentifier}>{order.patientIdentifier}</td>
                <td className="px-4 py-2"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-2 text-gray-700">₦{order.totalPrice?.toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-150 font-semibold shadow-sm"
                    onClick={() => onViewDetails(order)}
                    tabIndex={0}
                    aria-label={`View details for order ${order.id}`}
                  >
                    View Order
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