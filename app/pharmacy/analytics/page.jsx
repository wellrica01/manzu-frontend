'use client';
import React, { useEffect, useState } from 'react';
import {
  LineChart, BarChart, PieChart, TrendingUp, TrendingDown,
  DollarSign, Package, ShoppingCart, Users, Calendar,
  Activity, Clock, AlertCircle, Loader2, Filter, Download,
  RefreshCw, ArrowUpRight, ArrowDownRight, Pill, Star
} from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const brandGreen = "#1ABA7F";
const brandBlue = "#225F91";

// API Functions
async function fetchOrders(params = {}) {
  const token = localStorage.getItem('pharmacyToken');
  const queryParams = new URLSearchParams(params).toString();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders?${queryParams}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

async function fetchInventory() {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}

// Helper Functions
function filterOrdersByRange(orders, range, customStart, customEnd) {
  if (range === 'all') return orders;
  
  const now = new Date();
  let start;
  
  switch(range) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (customStart && customEnd) {
        start = new Date(customStart);
        const end = new Date(customEnd);
        return orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= start && orderDate <= end;
        });
      }
      return orders;
    default:
      return orders;
  }
  
  return orders.filter(o => new Date(o.createdAt) >= start);
}

// Components
function StatCard({ icon: Icon, label, value, trend, trendValue, color = brandBlue, loading }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && trendValue !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            {TrendIcon && <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />}
            <span style={{ color: trendColor }} className="font-medium">
              {trendValue}%
            </span>
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <div className="text-2xl font-bold text-gray-900">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            value
          )}
        </div>
        <div className="text-xs font-medium text-gray-600">{label}</div>
      </div>
    </div>
  );
}

export default function EnhancedPharmacyAnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Time range filter
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const TIME_RANGES = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom', value: 'custom' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, inventoryData] = await Promise.all([
        fetchOrders({ limit: 100 }),
        fetchInventory()
      ]);
      setOrders(ordersData.orders || []);
      setInventory(inventoryData.medications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered data
  const filteredOrders = filterOrdersByRange(orders, range, customStart, customEnd);

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  
  // Customer metrics
  const uniqueCustomers = new Set(filteredOrders.map(o => o.userIdentifier)).size;
  const customerOrderCounts = filteredOrders.reduce((acc, o) => {
    acc[o.userIdentifier] = (acc[o.userIdentifier] || 0) + 1;
    return acc;
  }, {});
  const returningCustomers = Object.values(customerOrderCounts).filter(c => c > 1).length;

  // Order status breakdown
  const statusCounts = filteredOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Top medications
  const medicationCounts = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      const medName = item.medication?.brandName || 'Unknown';
      if (!medicationCounts[medName]) {
        medicationCounts[medName] = { count: 0, revenue: 0 };
      }
      medicationCounts[medName].count += item.quantity;
      medicationCounts[medName].revenue += item.quantity * item.price;
    });
  });
  
  const topMedications = Object.entries(medicationCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Sales over time (daily for last 30 days or range)
  const salesByDate = filteredOrders.reduce((acc, o) => {
    const date = new Date(o.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + o.totalPrice;
    return acc;
  }, {});
  
  const sortedDates = Object.keys(salesByDate).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  // Chart data
  const salesChartData = {
    labels: sortedDates,
    datasets: [{
      label: 'Revenue',
      data: sortedDates.map(date => salesByDate[date]),
      borderColor: brandGreen,
      backgroundColor: `${brandGreen}20`,
      fill: true,
      tension: 0.4,
    }]
  };

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: [
        '#10B981', // green
        '#3B82F6', // blue
        '#8B5CF6', // purple
        '#F59E0B', // yellow
        '#EF4444', // red
      ],
    }]
  };

  const topMedsChartData = {
    labels: topMedications.map(([name]) => name),
    datasets: [{
      label: 'Units Sold',
      data: topMedications.map(([, data]) => data.count),
      backgroundColor: brandBlue,
    }]
  };

  // Inventory health metrics
  const lowStockItems = inventory.filter(i => i.stock > 0 && i.stock < 10).length;
  const outOfStockItems = inventory.filter(i => i.stock === 0).length;
  const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.stock * i.price), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1ABA7F] mx-auto" />
          <p className="text-gray-600 mt-3 text-base">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-600 mt-3 text-base">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-[#1ABA7F] text-white text-sm rounded-lg hover:bg-[#159e6a] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] rounded-2xl shadow-lg p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Analytics Dashboard
            </h1>
            <p className="text-white/90 text-sm mt-1">Comprehensive insights into your pharmacy's performance</p>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 font-semibold text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-[#225F91]" />
          <h2 className="text-base font-semibold text-gray-900">Time Period</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TIME_RANGES.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                range === opt.value
                  ? 'bg-[#1ABA7F] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₦${Math.round(totalRevenue).toLocaleString()}`}
          color={brandGreen}
          loading={loading}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={totalOrders}
          color={brandBlue}
          loading={loading}
        />
        <StatCard
          icon={Activity}
          label="Avg Order Value"
          value={`₦${Math.round(avgOrderValue).toLocaleString()}`}
          color="#8B5CF6"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Unique Customers"
          value={uniqueCustomers}
          color="#F59E0B"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Over Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#225F91]" />
            Revenue Trend
          </h3>
          <div className="h-56">
            <Line 
              data={salesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `₦${context.parsed.y.toLocaleString()}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `₦${value.toLocaleString()}`,
                      font: { size: 10 }
                    }
                  },
                  x: {
                    ticks: {
                      font: { size: 10 }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#225F91]" />
            Order Status Distribution
          </h3>
          <div className="h-56">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: {
                      font: { size: 10 },
                      padding: 8
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Medications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-[#225F91]" />
            Top Selling Medications
          </h3>
          <div className="h-56">
            <Bar
              data={topMedsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      font: { size: 10 }
                    }
                  },
                  x: {
                    ticks: {
                      font: { size: 10 }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Customer Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#225F91]" />
            Customer Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
              <div>
                <div className="text-xs text-gray-600 font-medium">Total Customers</div>
                <div className="text-2xl font-bold text-gray-900">{uniqueCustomers}</div>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
              <div>
                <div className="text-xs text-gray-600 font-medium">Returning Customers</div>
                <div className="text-2xl font-bold text-gray-900">{returningCustomers}</div>
              </div>
              <Star className="w-10 h-10 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200">
              <div>
                <div className="text-xs text-gray-600 font-medium">Retention Rate</div>
                <div className="text-2xl font-bold text-gray-900">
                  {uniqueCustomers ? Math.round((returningCustomers / uniqueCustomers) * 100) : 0}%
                </div>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#225F91]" />
          Inventory Health
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-xs text-gray-600 font-medium">Total Items</div>
            <div className="text-xl font-bold text-blue-600">{inventory.length}</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <div className="text-xs text-gray-600 font-medium">Low Stock</div>
            <div className="text-xl font-bold text-yellow-600">{lowStockItems}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
            <div className="text-xs text-gray-600 font-medium">Out of Stock</div>
            <div className="text-xl font-bold text-red-600">{outOfStockItems}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="text-xs text-gray-600 font-medium">Total Value</div>
            <div className="text-base font-bold text-green-600">₦{Math.round(totalInventoryValue).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Top Medications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#225F91]" />
            Top Performing Medications
          </h3>
          <button className="px-3 py-1.5 bg-[#225F91] text-white text-sm rounded-lg hover:bg-[#1A4971] transition-colors flex items-center gap-1.5 font-medium">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-3 px-2 font-semibold text-gray-600 text-xs">Rank</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 text-xs">Medication</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 text-xs">Units Sold</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 text-xs">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topMedications.map(([name, data], index) => (
                <tr key={name} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#225F91] to-[#1ABA7F] text-white font-bold text-xs">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-medium text-gray-900 text-sm">{name}</td>
                  <td className="py-3 px-2 text-gray-700 text-sm">{data.count}</td>
                  <td className="py-3 px-2 font-semibold text-green-600 text-sm">
                    ₦{Math.round(data.revenue).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}