import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardSummary() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        // Fetch inventory
        const medsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!medsRes.ok) throw new Error('Failed to fetch medications');
        const medsData = await medsRes.json();
        setMeds(medsData.medications || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Top 3 low stock medications
  const lowStockMeds = [...meds]
    .filter(m => m.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-md min-h-[140px] animate-pulse">
        <div className="h-6 w-1/2 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
        <div className="h-10 w-32 bg-gray-200 rounded mt-4" />
      </div>
    );
  }
  if (error) return <div className="rounded-2xl bg-white p-6 shadow-md text-red-500">{error}</div>;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-md min-h-[140px] flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-2 text-primary">Low Stock Medications</h2>
        {lowStockMeds.length === 0 ? (
          <div className="text-gray-400 text-sm">No medications are low in stock 🎉</div>
        ) : (
          <ul className="space-y-2">
            {lowStockMeds.map(med => (
              <li key={med.medicationId} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                <span className="font-medium text-gray-700 truncate">{med.name}</span>
                <span className="text-xs font-semibold text-red-600">Stock: {med.stock}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-2">
        <Link href="/pharmacy/inventory" className="inline-block bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all">View Inventory</Link>
      </div>
    </div>
  );
} 