import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function groupSalesByDate(orders) {
  const salesByDate = {};
  (orders || []).forEach(order => {
    const date = new Date(order.createdAt).toISOString().slice(0, 10);
    salesByDate[date] = (salesByDate[date] || 0) + (order.totalPrice || 0);
  });
  // Convert to array and sort by date
  return Object.entries(salesByDate)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function SalesChart({ orders, loading }) {
  const data = groupSalesByDate(orders);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading sales chart...</div>;
  if (!data.length) return <div className="h-48 flex items-center justify-center text-gray-400">No sales data available.</div>;

  return (
    <div className="bg-gray-50 rounded-xl shadow-md p-2" aria-label="Sales Over Time Chart">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} angle={-30} textAnchor="end" height={50} tick={{ fontFamily: 'monospace' }} />
          <YAxis fontSize={12} tickFormatter={v => `₦${v.toLocaleString()}`} tick={{ fontFamily: 'monospace' }} />
          <Tooltip formatter={v => `₦${v.toLocaleString()}`} labelFormatter={l => `Date: ${l}`} />
          <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 