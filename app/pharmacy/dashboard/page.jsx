"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  ArrowRight,
} from "lucide-react";
import PayoutSummaryWidget from './components/PayoutSummaryWidget';

const brandBlue = "#225F91";
const brandGreen = "#1ABA7F";
const brandOrange = "#FF6B35";
const brandPurple = "#7C3AED";
const brandRed = "#EF4444";

function Card({ children, className, onClick }) {
  return (
    <div 
      className={`bg-white rounded-lg shadow ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Clickable Metric Card for navigation
function MetricCard({ icon: Icon, label, value, color, trend, trendValue, subtitle, prefix = "", onClick, href }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';

  return (
    <Card className="p-4 md:p-6 rounded-lg md:rounded-2xl shadow-lg bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 hover:shadow-xl transition-all duration-300 group" onClick={onClick}>
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`p-2 md:p-3 rounded-lg md:rounded-2xl group-hover:scale-110 transition-transform duration-300`} 
             style={{ background: `linear-gradient(135deg, ${color}15, ${color}25)` }}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color }} />
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-xs md:text-sm">
            <TrendIcon className="w-3 h-3 md:w-4 md:h-4" style={{ color: trendColor }} />
            <span style={{ color: trendColor }} className="font-medium">
              {trendValue}%
            </span>
          </div>
        )}
      </div>
      <div className="space-y-0.5 md:space-y-1">
        <div className="text-2xl md:text-3xl font-bold text-gray-900">{prefix}{value}</div>
        <div className="text-xs md:text-sm font-medium text-gray-600">{label}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </Card>
  );
}

// Clickable Alert Card for navigation
function AlertCard({ icon: Icon, title, count, color, description, onClick }) {
  return (
    <Card className={`p-3 md:p-4 rounded-lg md:rounded-lg border-l-4 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all`} 
          style={{ borderLeftColor: color }}
          onClick={onClick}>
      <div className="flex items-center space-x-2 md:space-x-3">
        <div className={`p-1.5 md:p-2 rounded-lg`} style={{ background: color + '20' }}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">{title}</h3>
            <span className="text-xl md:text-2xl font-bold ml-2" style={{ color }}>{count}</span>
          </div>
          <p className="text-xs md:text-sm text-gray-600 truncate">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </Card>
  );
}

function TopSellingCard({ medications }) {
  return (
    <Card className="p-4 md:p-6 rounded-lg md:rounded-2xl shadow-lg bg-white border border-gray-200/50">
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2" style={{ color: brandBlue }}>
        <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
        Top Selling (Last 7 Days)
      </h3>
      <div className="space-y-2 md:space-y-3">
        {medications.map((med, idx) => (
          <div key={idx} className="flex items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-lg bg-gray-50/70 hover:bg-gray-100/70 transition-colors">
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-semibold text-sm md:text-base text-gray-900 truncate">{med.name}</div>
              <div className="text-xs text-gray-500">{med.orders} orders • {med.quantity} units</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-base md:text-lg font-bold text-green-600">₦{med.revenue.toLocaleString()}</div>
            </div>
          </div>
        ))}
        {medications.length === 0 && (
          <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-400">No sales data available</div>
        )}
      </div>
    </Card>
  );
}

function LowStockCard({ medications }) {
  return (
    <Card className="p-4 md:p-6 rounded-lg md:rounded-2xl shadow-lg bg-white border border-gray-200/50">
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2" style={{ color: brandRed }}>
        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
        Low Stock Alert
      </h3>
      <div className="space-y-2 md:space-y-3">
        {medications.map((med, idx) => (
          <div key={idx} className="flex items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-lg bg-red-50/50 border border-red-100">
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-semibold text-sm md:text-base text-gray-900 truncate">{med.name}</div>
              <div className="text-xs text-gray-500 truncate">{med.form}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-base md:text-lg font-bold text-red-600">{med.stock} left</div>
              <div className="text-xs text-gray-500">₦{med.price}</div>
            </div>
          </div>
        ))}
        {medications.length === 0 && (
          <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-400">All medications well stocked</div>
        )}
      </div>
    </Card>
  );
}

export default function PharmacyDashboard() {
  const router = useRouter();
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
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            Monitor your pharmacy's performance
            {data.pendingOrders > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {data.pendingOrders} pending orders
              </span>
            )}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs md:text-sm text-gray-500">Last updated</div>
          <div className="text-sm md:text-lg font-semibold text-gray-700">{new Date().toLocaleString()}</div>
        </div>
      </div>


      {/* Key Metrics - Updated with status badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <MetricCard 
          icon={ShoppingCart} 
          label="Walk-in Sales" 
          value={data.posSalesToday || 0}
          color={brandPurple}
          trend={data.posSalesTrend > 0 ? 'up' : data.posSalesTrend < 0 ? 'down' : null}
          trendValue={Math.abs(data.posSalesTrend || 0)}
          subtitle="Click to open POS"
          onClick={() => router.push('/pharmacy/pos/new-sale')}
        />
        
        {/* Updated Online Orders card with status badges */}
        <Card 
          className="p-4 md:p-6 rounded-lg md:rounded-2xl shadow-lg bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 hover:shadow-xl transition-all duration-300 group cursor-pointer" 
          onClick={() => router.push('/pharmacy/orders')}
        >
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className={`p-2 md:p-3 rounded-lg md:rounded-2xl group-hover:scale-110 transition-transform duration-300`} 
                style={{ background: `linear-gradient(135deg, ${brandGreen}15, ${brandGreen}25)` }}>
              <Package className="w-5 h-5 md:w-6 md:h-6" style={{ color: brandGreen }} />
            </div>
            {data.revenueTrend && (
              <div className="flex items-center space-x-1 text-xs md:text-sm">
                {data.revenueTrend > 0 ? 
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500" /> : 
                  <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                }
                <span className={data.revenueTrend > 0 ? "text-green-500" : "text-red-500"} className="font-medium">
                  {Math.abs(data.revenueTrend)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{data.ordersToday || 0}</div>
              <div className="text-xs md:text-sm font-medium text-gray-600">Online Orders Today</div>
            </div>
            
            {/* Status badges */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-gray-500">Pending</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-orange-600">{data.pendingOrders || 0}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-gray-500">Processing</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-blue-600">{data.processingOrders || 0}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-gray-500">Completed</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-green-600">{data.completedOrders || 0}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Summary - Combined view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 rounded-lg md:rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200/50">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Total Revenue Today</h3>
            <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">₦{combinedRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">From {combinedOrders} total transactions</div>
        </Card>

        <PayoutSummaryWidget />

        <Card className="p-4 md:p-6 rounded-lg md:rounded-2xl shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Inventory Status</h3>
            <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
          </div>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-gray-600">Low Stock Items</span>
              <span className="text-xl md:text-2xl font-bold text-red-600">{data.inventoryAlerts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-gray-600">Expiring Soon (30d)</span>
              <span className="text-xl md:text-2xl font-bold text-orange-600">{data.expiringMeds || 0}</span>
            </div>
          </div>
        </Card>
      </div>


      {/* Top Selling & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        <TopSellingCard medications={data.topSellingMeds || []} />
        <LowStockCard medications={data.lowStockMeds || []} />
      </div>

      {/* Recent Activity */}
      <Card className="p-3 md:p-4 rounded-lg md:rounded-2xl shadow-lg bg-white border border-gray-200/50">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Recent Activity</h2>
          <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
            <Activity className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Last {(data.recentActivity || []).length} transactions</span>
            <span className="sm:hidden">{(data.recentActivity || []).length}</span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
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
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          activity.type === "ORDER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {activity.type}
                      </span>
                     </td>
                    <td className="py-4 px-3">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        #{activity.id}
                      </span>
                     </td>
                    <td className="py-4 px-3 text-gray-700">{activity.name || "Walk-in"} </td>
                    <td className="py-4 px-3 font-semibold text-green-600">
                      ₦{activity.amount?.toLocaleString?.() ?? activity.amount}
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
                    <td className="py-4 px-3 text-sm text-gray-500">
                      {new Date(activity.time).toLocaleString()}
                     </td>
                   </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <Activity className="w-12 h-12 text-gray-300" />
                      <span className="text-lg font-medium text-gray-400">
                        No recent activity
                      </span>
                    </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-3">
          {Array.isArray(data.recentActivity) && data.recentActivity.length > 0 ? (
            data.recentActivity.map((activity, index) => (
              <div
                key={`${activity.type}-${activity.id}-${index}`}
                className="border border-gray-100 rounded-lg p-3 shadow-sm bg-white"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        activity.type === "ORDER"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {activity.type}
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      #{activity.id}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
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
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-sm text-gray-700 font-medium truncate">
                      {activity.name || "Walk-in"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.time).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="text-base font-bold text-green-600">
                    ₦{activity.amount?.toLocaleString?.() ?? activity.amount}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center space-y-2 py-8">
              <Activity className="w-10 h-10 text-gray-300" />
              <span className="text-base font-medium text-gray-400">
                No recent activity
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}