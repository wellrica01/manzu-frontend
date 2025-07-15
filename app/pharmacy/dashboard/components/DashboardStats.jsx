import { ClipboardList, Clock, DollarSign, AlertTriangle } from 'lucide-react';

export default function DashboardStats({ stats }) {
  const statCards = [
    {
      label: 'Orders Today',
      value: stats.ordersToday,
      icon: ClipboardList,
      color: 'from-primary to-blue-600',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      label: 'Revenue',
      value: `₦${stats.revenue}`,
      icon: DollarSign,
      color: 'from-green-400 to-green-600',
    },
    {
      label: 'Low Stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'from-red-400 to-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className={`rounded-2xl p-6 bg-gradient-to-br ${color} text-white shadow-lg flex flex-col items-start gap-4 transition-transform duration-200 hover:scale-105`}>
          <Icon className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm font-medium opacity-80">{label}</div>
        </div>
      ))}
    </div>
  );
} 