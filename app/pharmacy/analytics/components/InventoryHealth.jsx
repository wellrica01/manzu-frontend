import React from 'react';
import { AlertTriangle, Timer } from 'lucide-react';

function getLowStock(medications) {
  return (medications || []).filter(m => m.stock <= 5);
}
function getExpiringSoon(medications) {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return (medications || []).filter(m => m.expiryDate && new Date(m.expiryDate) <= soon && new Date(m.expiryDate) >= now);
}
function getTotalStockValue(medications) {
  return (medications || []).reduce((sum, m) => sum + (m.stock * m.price), 0);
}

export default function InventoryHealth({ medications, loading }) {
  const lowStock = getLowStock(medications);
  const expiringSoon = getExpiringSoon(medications);
  const totalValue = getTotalStockValue(medications);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading inventory health...</div>;
  if (!medications.length) return <div className="h-48 flex items-center justify-center text-gray-400">No inventory data available.</div>;

  return (
    <div>
      <div className="mb-4 font-semibold">Total Stock Value: <span className="text-primary font-mono">₦{totalValue.toLocaleString()}</span></div>
      <div className="mb-2 font-medium flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        Low Stock (≤5)
        <span className="ml-1 text-gray-400" title="Medications with 5 or fewer units in stock.">?</span>
      </div>
      <div className="overflow-x-auto mb-4">
        {lowStock.length ? (
          <table className="min-w-full bg-white rounded-xl shadow-md text-sm" aria-label="Low Stock Medications">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Medication</th>
                <th className="px-4 py-2 text-left">Stock</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(m => (
                <tr key={m.name} className="border-t hover:bg-primary/5 transition">
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2 font-mono">
                    <span className="inline-block px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold border border-yellow-200">
                      {m.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-gray-400 mb-4">No low stock medications.</div>}
      </div>
      <div className="mb-2 font-medium flex items-center gap-2">
        <Timer className="w-4 h-4 text-blue-500" />
        Expiring Soon (≤30 days)
        <span className="ml-1 text-gray-400" title="Medications expiring within 30 days.">?</span>
      </div>
      <div className="overflow-x-auto">
        {expiringSoon.length ? (
          <table className="min-w-full bg-white rounded-xl shadow-md text-sm" aria-label="Expiring Soon Medications">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Medication</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {expiringSoon.map(m => (
                <tr key={m.name} className="border-t hover:bg-primary/5 transition">
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2 font-mono">{new Date(m.expiryDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-gray-400">No medications expiring soon.</div>}
      </div>
    </div>
  );
} 