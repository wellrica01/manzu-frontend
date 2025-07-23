'use client';
import { User, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({}); // { [orderId]: true/false }

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch('http://localhost:5000/api/pharmacy/orders', {
          headers: { 'Authorization': `Bearer ${token}` },
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
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch(`http://localhost:5000/api/pharmacy/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Order status updated');
      // Update local state
      setOrders(orders => orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-md min-h-[220px] animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/3 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <div className="rounded-2xl bg-white p-6 shadow-md text-red-500">{error}</div>;
  if (!orders.length) return <div className="rounded-2xl bg-white p-6 shadow-md text-gray-500">No recent orders.</div>;

  // Sort orders by createdAt descending (latest first)
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-md min-h-[220px]">
      <h2 className="text-lg font-semibold mb-4 text-primary">Recent Orders</h2>
      <ul className="divide-y divide-gray-100">
        {sortedOrders.slice(0, 5).map(order => {
          const name = order.name || '';
          return (
            <li
              key={order.id}
              className="flex items-center gap-4 py-3 transition-colors duration-150 hover:bg-primary/5 cursor-pointer rounded-lg"
              tabIndex={0}
              aria-label={`Order for ${name || 'Unknown'} with tracking code ${order.trackingCode}`}
            >
              {/* Avatar */}
              <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white font-bold text-lg">
                {name[0]?.toUpperCase() || <User className="w-5 h-5" />}
              </span>
              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">
                  {name || <span className="italic text-gray-400">Unknown User</span>}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  <span className="font-medium">Tracking:</span> {order.trackingCode || <span className="italic">N/A</span>}
                </div>
              </div>
              {/* Price */}
              <div className="text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                ₦{order.totalPrice?.toLocaleString()}
              </div>
              {/* Date */}
              <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                {formatDate(order.createdAt)}
              </div>
              {/* Status dropdown */}
              <div className="ml-4">
                <label htmlFor={`status-${order.id}`} className="sr-only">Order Status</label>
                <div className="relative">
                  <select
                    id={`status-${order.id}`}
                    className={`block w-32 px-2 py-1 rounded border text-xs font-semibold focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                      order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      order.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      order.status === 'ready_for_pickup' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                    value={order.status}
                    disabled={!!updating[order.id]}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    aria-label="Update order status"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {updating[order.id] && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 