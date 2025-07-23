import React from 'react';

function getTopMedications(orders) {
  const medStats = {};
  (orders || []).forEach(order => {
    (order.items || []).forEach(item => {
      const name = item.medication.brandName || item.medication.genericName;
      const revenue = (item.price || 0) * (item.quantity || 0);
      if (!medStats[name]) medStats[name] = { name, qty: 0, revenue: 0 };
      medStats[name].qty += item.quantity || 0;
      medStats[name].revenue += revenue;
    });
  });
  return Object.values(medStats)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
}

export default function TopMedications({ orders, loading }) {
  const topMeds = getTopMedications(orders);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading top medications...</div>;
  if (!topMeds.length) return <div className="h-48 flex items-center justify-center text-gray-400">No medication data available.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-xl shadow-md text-sm" aria-label="Top Medications">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left" title="Medication name">Medication</th>
            <th className="px-4 py-2 text-left" title="Total quantity ordered">Total Ordered</th>
            <th className="px-4 py-2 text-left" title="Total revenue from this medication">Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          {topMeds.map((med) => (
            <tr key={med.name} className="border-t hover:bg-primary/5 transition">
              <td className="px-4 py-2">{med.name}</td>
              <td className="px-4 py-2 font-mono">{med.qty}</td>
              <td className="px-4 py-2 font-mono">₦{med.revenue.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 