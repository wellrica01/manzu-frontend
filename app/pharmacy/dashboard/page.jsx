
"use client";
import { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Activity,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  Truck,
} from "lucide-react";

const brandBlue = "#225F91";
const brandGreen = "#1ABA7F";
const brandOrange = "#FF6B35";
const brandPurple = "#7C3AED";
const brandRed = "#EF4444";

function Card({ children, className }) {
  return (
    <div className={`bg-white rounded-lg shadow ${className || ''}`}>
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, trend, trendValue, subtitle, prefix = "" }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';

  return (
    <Card className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`} 
             style={{ background: `linear-gradient(135deg, ${color}15, ${color}25)` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-sm">
            <TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
            <span style={{ color: trendColor }} className="font-medium">
              {trendValue}%
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold text-gray-900">{prefix}{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </Card>
  );
}

function AlertCard({ icon: Icon, title, count, color, description, onClick }) {
  return (
    <Card className={`p-4 rounded-xl border-l-4 bg-gradient-to-r from-white to-gray-50 cursor-pointer hover:shadow-md transition-all`} 
          style={{ borderLeftColor: color }}
          onClick={onClick}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg`} style={{ background: color + '20' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className="text-2xl font-bold" style={{ color }}>{count}</span>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function TopSellingCard({ medications }) {
  return (
    <Card className="p-6 rounded-2xl shadow-lg bg-white border border-gray-200/50">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandBlue }}>
        <BarChart3 className="w-5 h-5" />
        Top Selling (Last 7 Days)
      </h3>
      <div className="space-y-3">
        {medications.map((med, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-gray-100/70 transition-colors">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{med.name}</div>
              <div className="text-xs text-gray-500">{med.orders} orders • {med.quantity} units</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">₦{med.revenue.toLocaleString()}</div>
            </div>
          </div>
        ))}
        {medications.length === 0 && (
          <div className="text-center py-8 text-gray-400">No sales data available</div>
        )}
      </div>
    </Card>
  );
}

function LowStockCard({ medications }) {
  return (
    <Card className="p-6 rounded-2xl shadow-lg bg-white border border-gray-200/50">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: brandRed }}>
        <AlertTriangle className="w-5 h-5" />
        Low Stock Alert
      </h3>
      <div className="space-y-3">
        {medications.map((med, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{med.name}</div>
              <div className="text-xs text-gray-500">{med.form}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-600">{med.stock} left</div>
              <div className="text-xs text-gray-500">₦{med.price}</div>
            </div>
          </div>
        ))}
        {medications.length === 0 && (
          <div className="text-center py-8 text-gray-400">All medications well stocked</div>
        )}
      </div>
    </Card>
  );
}

export default function PharmacyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!res.ok) throw new Error('Failed to load dashboard data');
        
        const result = await res.json();
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin w-12 h-12 text-[#1ABA7F] mx-auto" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <p className="text-xl font-semibold text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const combinedRevenue = (data.revenueToday || 0) + (data.posRevenueToday || 0);
  const combinedOrders = (data.ordersToday || 0) + (data.posSalesToday || 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Monitor your pharmacy's performance</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-lg font-semibold text-gray-700">{new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          icon={CreditCard} 
          label="POS Sales Today" 
          value={data.posSalesToday || 0}
          color={brandPurple}
          trend={data.posSalesTrend > 0 ? 'up' : data.posSalesTrend < 0 ? 'down' : null}
          trendValue={Math.abs(data.posSalesTrend || 0)}
          subtitle="Walk-in customers"
        />
        <MetricCard 
          icon={DollarSign} 
          label="Online Revenue" 
          value={(data.revenueToday || 0).toLocaleString()}
          color={brandGreen}
          trend={data.revenueTrend > 0 ? 'up' : data.revenueTrend < 0 ? 'down' : null}
          trendValue={Math.abs(data.revenueTrend || 0)}
          prefix="₦"
          subtitle="From online orders"
        />
        <MetricCard 
          icon={DollarSign} 
          label="POS Revenue" 
          value={(data.posRevenueToday || 0).toLocaleString()}
          color={brandOrange}
          trend={data.posRevenueTrend > 0 ? 'up' : data.posRevenueTrend < 0 ? 'down' : null}
          trendValue={Math.abs(data.posRevenueTrend || 0)}
          prefix="₦"
          subtitle="From walk-in sales"
        />
      </div>

      {/* Combined Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Total Today</h3>
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Combined Revenue</div>
              <div className="text-3xl font-bold text-blue-600">₦{combinedRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Combined Orders/Sales</div>
              <div className="text-3xl font-bold text-green-600">{combinedOrders}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Inventory Status</h3>
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Low Stock Items</span>
              <span className="text-2xl font-bold text-red-600">{data.inventoryAlerts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expiring Soon (30d)</span>
              <span className="text-2xl font-bold text-orange-600">{data.expiringMeds || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Status Alerts */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Processing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AlertCard 
            icon={Clock}
            title="Pending Orders"
            count={data.pendingOrders || 0}
            color={brandOrange}
            description="New orders awaiting processing"
          />
          <AlertCard 
            icon={Package}
            title="Processing"
            count={data.processingOrders || 0}
            color={brandBlue}
            description="Orders currently being prepared"
          />
          <AlertCard 
            icon={CheckCircle}
            title="Ready for Pickup"
            count={data.readyOrders || 0}
            color={brandGreen}
            description="Orders ready for customer pickup"
          />
        </div>
      </div>

      {/* Top Selling & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingCard medications={data.topSellingMeds || []} />
        <LowStockCard medications={data.lowStockMeds || []} />
      </div>

      {/* Recent Activity */}
      <Card className="p-6 rounded-2xl shadow-lg bg-white border border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="w-4 h-4" />
            <span>Last {(data.recentActivity || []).length} transactions</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-4 px-3 font-semibold text-gray-600">Type</th>
                <th className="text-left py-4 px-3 font-semibold text-gray-600">ID</th>
                <th className="text-left py-4 px-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left py-4 px-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-4 px-3 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-3 font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.isArray(data.recentActivity) && data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity, index) => (
                  <tr key={`${activity.type}-${activity.id}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        activity.type === 'ORDER' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {activity.type}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-mono text-sm font-medium text-gray-900">#{activity.id}</span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-gray-700">{activity.name || 'Walk-in'}</span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-semibold text-green-600">
                        ₦{activity.amount?.toLocaleString?.() ?? activity.amount}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          activity.status === "CONFIRMED" || activity.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : activity.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-800"
                            : activity.status === "READY_FOR_PICKUP"
                            ? "bg-purple-100 text-purple-800"
                            : activity.status === "CASH" || activity.status === "CARD"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-sm text-gray-500">
                        {new Date(activity.time).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <Activity className="w-12 h-12 text-gray-300" />
                      <span className="text-lg font-medium text-gray-400">No recent activity</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}