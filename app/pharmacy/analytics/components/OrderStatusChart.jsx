import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  pending: '#fbbf24',
  confirmed: '#3b82f6',
  processing: '#6366f1',
  shipped: '#0ea5e9',
  delivered: '#22c55e',
  ready_for_pickup: '#06b6d4',
  cancelled: '#ef4444',
};
const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  ready_for_pickup: 'Ready for Pickup',
  cancelled: 'Cancelled',
};

function getStatusData(orders) {
  const counts = {};
  (orders || []).forEach(order => {
    counts[order.status] = (counts[order.status] || 0) + 1;
  });
  return Object.entries(counts).map(([status, value]) => ({ status, value }));
}

export default function OrderStatusChart({ orders, loading }) {
  const data = getStatusData(orders);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading order status chart...</div>;
  if (!data.length) return <div className="h-48 flex items-center justify-center text-gray-400">No order data available.</div>;

  return (
    <div className="bg-gray-50 rounded-xl shadow-md p-2" aria-label="Order Status Breakdown Chart">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({ status }) => STATUS_LABELS[status] || status}
          >
            {data.map((entry, idx) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip formatter={(v, n, props) => [`${v}`, STATUS_LABELS[props.payload.status] || props.payload.status]} />
          <Legend formatter={status => STATUS_LABELS[status] || status} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 