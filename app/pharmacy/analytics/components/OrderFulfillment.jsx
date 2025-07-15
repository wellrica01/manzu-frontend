import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BadgeCheck } from 'lucide-react';

function getFulfillmentTimes(orders) {
  // Only delivered or ready_for_pickup
  return (orders || [])
    .filter(o => (o.status === 'delivered' || o.status === 'ready_for_pickup') && o.filledAt && o.createdAt)
    .map(o => {
      const hours = (new Date(o.filledAt) - new Date(o.createdAt)) / (1000 * 60 * 60);
      return Math.round(hours);
    });
}
function getAvgFulfillmentTime(times) {
  if (!times.length) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}
function getHistogram(times) {
  // Group by hour buckets
  const buckets = {};
  times.forEach(h => {
    const bucket = h <= 1 ? '≤1h' : h <= 4 ? '≤4h' : h <= 12 ? '≤12h' : h <= 24 ? '≤24h' : '>24h';
    buckets[bucket] = (buckets[bucket] || 0) + 1;
  });
  return [
    { name: '≤1h', value: buckets['≤1h'] || 0 },
    { name: '≤4h', value: buckets['≤4h'] || 0 },
    { name: '≤12h', value: buckets['≤12h'] || 0 },
    { name: '≤24h', value: buckets['≤24h'] || 0 },
    { name: '>24h', value: buckets['>24h'] || 0 },
  ];
}
function getRecentCancellations(orders) {
  return (orders || [])
    .filter(o => o.status === 'cancelled')
    .sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt))
    .slice(0, 5);
}

export default function OrderFulfillment({ orders, loading }) {
  const times = getFulfillmentTimes(orders);
  const avgTime = getAvgFulfillmentTime(times);
  const hist = getHistogram(times);
  const cancellations = getRecentCancellations(orders);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading order fulfillment...</div>;
  if (!orders.length) return <div className="h-48 flex items-center justify-center text-gray-400">No order data available.</div>;

  return (
    <div>
      <div className="mb-6 font-semibold flex items-center gap-2">
        Average Fulfillment Time:
        <span className="bg-primary/10 text-primary font-mono px-3 py-1 rounded-full ml-1 flex items-center gap-1">
          <BadgeCheck className="w-4 h-4" />
          {avgTime}h
        </span>
      </div>
      <div className="mb-2 font-medium">Fulfillment Time Distribution</div>
      <div className="bg-gray-50 rounded-xl p-2 mb-6">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={hist} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} tick={{ fontFamily: 'monospace' }} />
            <YAxis allowDecimals={false} fontSize={12} tick={{ fontFamily: 'monospace' }} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 mb-2 font-medium">Recent Cancellations</div>
      <div className="overflow-x-auto">
        {cancellations.length ? (
          <table className="min-w-full bg-white rounded-xl shadow-md text-sm" aria-label="Recent Cancellations">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {cancellations.map(o => (
                <tr key={o.id} className="border-t hover:bg-primary/5 transition">
                  <td className="px-4 py-2 font-mono">{o.id}</td>
                  <td className="px-4 py-2 capitalize">{o.status}</td>
                  <td className="px-4 py-2">{o.cancelReason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-gray-400">No recent cancellations.</div>}
      </div>
    </div>
  );
} 