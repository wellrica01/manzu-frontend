'use client';
import { useEffect, useState } from 'react';
import DashboardStats from './components/DashboardStats';
import RecentOrders from './components/RecentOrders';
import DashboardSummary from './components/DashboardSummary';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        // Fetch orders
        const ordersRes = await fetch('http://localhost:5000/api/pharmacy/orders', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersRes.json();
        const orders = ordersData.orders || [];
        const ordersToday = orders.filter(o => {
          const today = new Date();
          const created = new Date(o.createdAt);
          return created.getDate() === today.getDate() && created.getMonth() === today.getMonth() && created.getFullYear() === today.getFullYear();
        }).length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        // Fetch inventory for low stock
        const medsRes = await fetch('http://localhost:5000/api/pharmacy/medications', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!medsRes.ok) throw new Error('Failed to fetch medications');
        const medsData = await medsRes.json();
        const lowStock = (medsData.medications || []).filter(m => m.stock <= 5).length;
        setStats({
          ordersToday,
          pendingOrders,
          revenue: revenue.toLocaleString(),
          lowStock,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Dashboard Overview</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-6 bg-gradient-to-br from-gray-200 to-gray-300 text-white shadow-lg flex flex-col items-start gap-4 h-32" />
          ))}
        </div>
      ) : error ? (
        <div className="mb-8 text-red-500">{error}</div>
      ) : (
        <DashboardStats stats={stats} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DashboardSummary />
        <RecentOrders />
      </div>
    </div>
  );
}
