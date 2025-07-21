import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function getCustomerStats(orders) {
  const stats = {};
  (orders || []).forEach(order => {
    const id = order.userIdentifier;
    if (!stats[id]) stats[id] = { id, orders: 0, spent: 0 };
    stats[id].orders += 1;
    stats[id].spent += order.totalPrice || 0;
  });
  const arr = Object.values(stats);
  arr.sort((a, b) => b.spent - a.spent);
  return arr;
}

function getNewVsReturning(orders) {
  const stats = getCustomerStats(orders);
  let newCount = 0, returningCount = 0;
  stats.forEach(c => {
    if (c.orders > 1) returningCount++;
    else newCount++;
  });
  return [
    { name: 'New', value: newCount, tooltip: 'Customers with only one order.' },
    { name: 'Returning', value: returningCount, tooltip: 'Customers with more than one order.' },
  ];
}

const COLORS = ['#3b82f6', '#22c55e'];

export default function CustomerInsights({ orders, loading }) {
  const customers = getCustomerStats(orders).slice(0, 5);
  const pieData = getNewVsReturning(orders);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading customer insights...</div>;
  if (!orders.length) return <div className="h-48 flex items-center justify-center text-gray-400">No customer data available.</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="flex-1 overflow-x-auto">
        <div className="font-semibold mb-2">Top Customers</div>
        <table className="min-w-full bg-white rounded-xl shadow-md text-sm" aria-label="Top Customers">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Patient Identifier</th>
              <th className="px-4 py-2 text-left">Total Orders</th>
              <th className="px-4 py-2 text-left">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-t hover:bg-primary/5 transition">
                <td className="px-4 py-2 truncate max-w-xs" title={c.id}>{c.id}</td>
                <td className="px-4 py-2 font-mono">{c.orders}</td>
                <td className="px-4 py-2 font-mono">₦{c.spent.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex-1 bg-gray-50 rounded-xl p-4">
        <div className="font-semibold mb-2">New vs Returning Customers</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              {pieData.map((entry, idx) => (
                <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n, props) => [v, pieData.find(d => d.name === props.name)?.tooltip || props.name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 