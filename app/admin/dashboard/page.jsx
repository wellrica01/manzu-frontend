"use client";
import { useEffect, useState } from "react";
// Simple Card component
function Card({ children, className, style }) {
  return (
    <div className={`bg-white rounded-lg shadow ${className || ''}`} style={style}>
      {children}
    </div>
  );
}
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  Users,
  Package,
  ShoppingBag,
  FileText,
  Clock,
  Layers,
  FlaskConical,
  Beaker,
  Factory,
  Pill,
  BookOpen,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Activity,
  Shield,
  Calendar,
  Eye,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { fetchDashboard } from "./api";

const brandBlue = "#225F91";
const brandGreen = "#1ABA7F";
const brandOrange = "#FF6B35";
const brandPurple = "#7C3AED";

function MetricCard({ icon: Icon, label, value, color, trend, trendValue, subtitle }) {
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
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </Card>
  );
}

function AlertCard({ icon: Icon, title, count, color, description }) {
  return (
    <Card className={`p-4 rounded-xl border-l-4 bg-gradient-to-r from-white to-gray-50`} 
          style={{ borderLeftColor: color }}>
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

function QuickStatGrid({ title, stats, color }) {
  return (
    <Card className="p-6 rounded-2xl shadow-lg bg-white border border-gray-200/50">
      <h3 className="text-lg font-semibold mb-4" style={{ color }}>{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/70">
            <div className={`p-2 rounded-lg`} style={{ background: color + '20' }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-600">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDashboard();
        setStats(res.data?.summary ?? {});
        setLoading(false);
      } catch (e) {
        setError("Failed to load dashboard data.");
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex justify-center items-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin w-12 h-12 text-[#1ABA7F] mx-auto" />
          <p className="text-lg text-gray-600">Loading dashboard insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex justify-center items-center">
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

  const revenueGrowth = stats.revenue?.last7Days && stats.revenue?.last30Days 
    ? (((stats.revenue.last7Days * 4.3) - stats.revenue.last30Days) / stats.revenue.last30Days * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Monitor platform's performance and insights</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Last updated</div>
            <div className="text-lg font-semibold text-gray-700">{new Date().toLocaleString()}</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            icon={Package} 
            label="Total Pharmacies" 
            value={stats.pharmacies?.total ?? 0}
            color={brandBlue}
            trend={stats.pharmacies?.growthRate > 0 ? 'up' : stats.pharmacies?.growthRate < 0 ? 'down' : null}
            trendValue={Math.abs(stats.pharmacies?.growthRate ?? 0)}
            subtitle={`${stats.pharmacies?.new30Days ?? 0} new this month`}
          />
          <MetricCard 
            icon={ShoppingBag} 
            label="Total Orders" 
            value={stats.orders?.total ?? 0}
            color={brandGreen}
            trend={stats.orders?.growthRate > 0 ? 'up' : stats.orders?.growthRate < 0 ? 'down' : null}
            trendValue={Math.abs(stats.orders?.growthRate ?? 0)}
            subtitle={`${stats.orders?.last30Days ?? 0} in last 30 days`}
          />
          <MetricCard 
            icon={Users} 
            label="Platform Users" 
            value={stats.users?.total ?? 0}
            color={brandPurple}
            trend={stats.users?.growthRate > 0 ? 'up' : stats.users?.growthRate < 0 ? 'down' : null}
            trendValue={Math.abs(stats.users?.growthRate ?? 0)}
            subtitle={`${stats.users?.new30Days ?? 0} new users`}
          />
          <MetricCard 
            icon={DollarSign} 
            label="Revenue (30 days)" 
            value={`₦${(stats.revenue?.last30Days ?? 0).toLocaleString()}`}
            color={brandOrange}
            trend={revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : null}
            trendValue={Math.abs(revenueGrowth)}
            subtitle={`₦${(stats.revenue?.last7Days ?? 0).toLocaleString()} last 7 days`}
          />
        </div>

        {/* Alerts & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Priority Alerts</h2>
           <div className="space-y-4">
            <AlertCard 
              icon={Clock}
              title="Pending Prescriptions"
              count={stats.alerts?.pendingPrescriptions ?? 0}
              color={brandOrange}
              description="Prescriptions awaiting review and approval"
            />
            <AlertCard 
              icon={ShoppingBag}
              title="Pending Orders"
              count={stats.alerts?.pendingOrders ?? 0}
              color={brandOrange}
              description="Orders awaiting processing"
            />
             <AlertCard 
              icon={AlertTriangle}
              title="Unverified Pharmacies"
              count={stats.alerts?.unverifiedPharmacies ?? 0}
              color="#EF4444"
              description="Pharmacies pending verification process"
            />
          </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">System Health</h2>
            <Card className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-green-50 to-blue-50 border border-green-200/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Verification Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.systemHealth?.verificationRate ?? 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(stats.systemHealth?.verificationRate ?? 0, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {stats.pharmacies?.verified ?? 0} of {stats.pharmacies?.total ?? 0} pharmacies verified
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">Active Entities</span>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {stats.systemHealth?.totalActiveEntities ?? 0}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Drug Classifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickStatGrid 
            title="Drug Classifications"
            color={brandBlue}
            stats={[
              { label: "Anatomical", value: stats.drugClassifications?.anatomicalClasses?.total ?? 0, icon: Layers },
              { label: "Therapeutic", value: stats.drugClassifications?.therapeuticClasses?.total ?? 0, icon: FlaskConical },
              { label: "Pharmacological", value: stats.drugClassifications?.pharmacologicalClasses?.total ?? 0, icon: Beaker },
              { label: "Chemical", value: stats.drugClassifications?.chemicalClasses?.total ?? 0, icon: FlaskConical }
            ]}
          />
          
          <QuickStatGrid 
            title="Drug Components"
            color={brandGreen}
            stats={[
              { label: "Active Substances", value: stats.drugClassifications?.activeSubstances?.total ?? 0, icon: Pill },
              { label: "Generic Names", value: stats.drugClassifications?.genericNames?.total ?? 0, icon: BookOpen },
              { label: "Chemical Substances", value: stats.drugClassifications?.chemicalSubstances?.total ?? 0, icon: Beaker },
              { label: "Indications", value: stats.indications?.total ?? 0, icon: FileText }
            ]}
          />
          
          <QuickStatGrid 
            title="Platform Overview"
            color={brandPurple}
            stats={[
              { label: "Total Medications", value: stats.medications?.total ?? 0, icon: ShoppingBag },
              { label: "Manufacturers", value: stats.manufacturers?.total ?? 0, icon: Factory },
              { label: "Total Prescriptions", value: stats.prescriptions?.total ?? 0, icon: FileText },
              { label: "Processing Load", value: stats.systemHealth?.processingLoad ?? 0, icon: Activity }
            ]}
          />
        </div>

        {/* Recent Orders Table */}
        <Card className="p-6 rounded-2xl shadow-lg bg-white border border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>Last {stats.orders?.recent?.length ?? 0} orders</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-4 px-3 font-semibold text-gray-600">Order ID</th>
                  <th className="text-left py-4 px-3 font-semibold text-gray-600">Tracking Code</th>
                  <th className="text-left py-4 px-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-4 px-3 font-semibold text-gray-600">Total</th>
                  <th className="text-left py-4 px-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-4 px-3 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.isArray(stats.orders?.recent) && stats.orders.recent.length > 0 ? (
                  stats.orders.recent.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-3">
                        <span className="font-mono text-sm font-medium text-gray-900">#{order.id}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-medium text-gray-700">{order.trackingCode}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-gray-700">{order.userIdentifier}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-semibold text-green-600">
                          ₦{order.totalPrice?.toLocaleString?.() ?? order.totalPrice}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : order.status === "PROCESSING"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="w-12 h-12 text-gray-300" />
                        <span className="text-lg font-medium text-gray-400">No recent orders found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}