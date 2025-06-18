'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LogOut, Shield, Package, Users, Pill, FileText, AlertTriangle, Download, Sun, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, LineElement, PointElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.adminId;
      if (!userId || !['admin', 'support'].includes(decoded.role)) {
        localStorage.removeItem('adminToken');
        router.replace('/admin/login');
        return;
      }
      setAdminId(userId);
      setAdminRole(decoded.role);
    } catch (err) {
      localStorage.removeItem('adminToken');
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    if (!adminId || !adminRole) return;

    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.replace('/admin/login');
          return;
        }
        const response = await fetch('http://localhost:5000/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result.summary);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [adminId, adminRole, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  if (!adminId || !adminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground ml-2">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="card bg-destructive/10 border-l-4 border-destructive p-4 fade-in">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Enrich data with KPIs (replace with actual API data)
  const enrichedData = {
    pharmacies: {
      total: data.pharmacies.total,
      count: data.pharmacies.count,
      unverified: data.pharmacies.unverified || 5,
      verificationRate: data.pharmacies.verificationRate || ((data.pharmacies.count / data.pharmacies.total) * 100).toFixed(1),
    },
    medications: {
      total: data.medications.total,
      lowStock: data.medications.lowStock || 10,
      turnoverRate: data.medications.turnoverRate || 2.5, // Times inventory sold/replaced per period
    },
    prescriptions: {
      total: data.prescriptions.total,
      pending: data.prescriptions.pending,
      avgProcessingTime: data.prescriptions.avgProcessingTime || 24, // Hours
    },
    users: {
      total: data.users.total,
      active: data.users.active || 80,
      retentionRate: data.users.retentionRate || 65, // % of repeat customers
    },
    orders: {
      total: data.orders.total,
      recent: data.orders.recent,
      revenue: data.orders.revenue || 7500000, // Total revenue in NGN
      avgValue: data.orders.avgValue || 25000, // AOV in NGN
      revenueGrowth: data.orders.revenueGrowth || 12.5, // % growth vs. previous period
      fulfillmentRate: data.orders.fulfillmentRate || 95, // % of orders completed
      statusBreakdown: data.orders.statusBreakdown || { pending: 20, completed: 60, cancelled: 10 },
      trend: data.orders.trend || [
        { date: '2025-06-10', orders: 15, revenue: 375000 },
        { date: '2025-06-11', orders: 20, revenue: 500000 },
        { date: '2025-06-12', orders: 18, revenue: 450000 },
        { date: '2025-06-13', orders: 25, revenue: 625000 },
        { date: '2025-06-14', orders: 30, revenue: 750000 },
        { date: '2025-06-15', orders: 28, revenue: 700000 },
        { date: '2025-06-16', orders: 35, revenue: 875000 },
      ],
      pharmacyPerformance: data.orders.pharmacyPerformance || [
        { pharmacyId: 1, name: 'Pharmacy A', orders: 50 },
        { pharmacyId: 2, name: 'Pharmacy B', orders: 30 },
        { pharmacyId: 3, name: 'Pharmacy C', orders: 20 },
      ],
    },
  };

  // Filter orders based on search and date range
  const filteredOrders = enrichedData.orders.recent.filter(order =>
    (order.id.toString().includes(searchTerm) ||
     order.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.patientIdentifier.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (dateRange === 'all' || new Date(order.createdAt) >= new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000))
  );

  // Chart data for revenue trends
  const lineChartData = {
    labels: enrichedData.orders.trend.map(t => t.date),
    datasets: [
      {
        label: 'Revenue (NGN)',
        data: enrichedData.orders.trend.map(t => t.revenue),
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Orders',
        data: enrichedData.orders.trend.map(t => t.orders),
        borderColor: 'rgba(34, 197, 94, 0.8)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart data for order status breakdown
  const pieChartData = {
    labels: ['Pending', 'Completed', 'Cancelled'],
    datasets: [{
      data: [
        enrichedData.orders.statusBreakdown.pending,
        enrichedData.orders.statusBreakdown.completed,
        enrichedData.orders.statusBreakdown.cancelled,
      ],
      backgroundColor: ['rgba(234, 179, 8, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
      borderColor: ['rgba(234, 179, 8, 1)', 'rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 1,
    }],
  };

  // Chart data for pharmacy performance
  const barChartData = {
    labels: enrichedData.orders.pharmacyPerformance.map(p => p.name),
    datasets: [{
      label: 'Orders Processed',
      data: enrichedData.orders.pharmacyPerformance.map(p => p.orders),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in-20 duration-500 dashboard-wrapper">
      <div className="particle-bg">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="container mx-auto max-w-7xl space-y-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight animate-in zoom-in-50 duration-700">
            Admin Command
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse"> Center</span>
          </h1>
          <div className="flex gap-4">
            <Button
              onClick={toggleDarkMode}
              className="h-12 px-4 rounded-full bg-gray-200/50 dark:bg-gray-700/50 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </Button>
            <Button
              onClick={handleLogout}
              className="h-12 px-6 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all duration-300 animate-pulse"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 mr-2 animate-spin-slow" aria-hidden="true" />
              Logout
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {(enrichedData.pharmacies.unverified > 0 || enrichedData.medications.lowStock > 0 || enrichedData.users.retentionRate < 70 || enrichedData.orders.fulfillmentRate < 90) && (
          <Card className="shadow-3xl border border-gray-100/20 rounded-3xl bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg animate-in fade-in-20 duration-700">
            <CardHeader className="p-6 bg-gradient-to-r from-red-500/10 to-transparent">
              <CardTitle className="text-xl font-extrabold text-red-600 tracking-tight flex items-center">
                <AlertTriangle className="h-8 w-8 mr-3 text-red-600 animate-pulse" aria-hidden="true" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {enrichedData.pharmacies.unverified > 0 && (
                <p className="text-base font-semibold text-gray-900">
                  <span className="text-red-600">{enrichedData.pharmacies.unverified} pharmacies</span> are unverified.
                  <Button
                    variant="link"
                    className="ml-2 text-primary"
                    onClick={() => router.push('/admin/pharmacies?filter=unverified')}
                    aria-label="View unverified pharmacies"
                  >
                    Review Now
                  </Button>
                </p>
              )}
              {enrichedData.medications.lowStock > 0 && (
                <p className="text-base font-semibold text-gray-900">
                  <span className="text-red-600">{enrichedData.medications.lowStock} medications</span> are low in stock.
                  <Button
                    variant="link"
                    className="ml-2 text-primary"
                    onClick={() => router.push('/admin/medications?filter=low-stock')}
                    aria-label="View low stock medications"
                  >
                    Check Inventory
                  </Button>
                </p>
              )}
              {enrichedData.users.retentionRate < 70 && (
                <p className="text-base font-semibold text-gray-900">
                  Customer retention rate is low at <span className="text-red-600">{enrichedData.users.retentionRate}%</span>.
                  <Button
                    variant="link"
                    className="ml-2 text-primary"
                    onClick={() => router.push('/admin/users?filter=inactive')}
                    aria-label="View inactive users"
                  >
                    Analyze Users
                  </Button>
                </p>
              )}
              {enrichedData.orders.fulfillmentRate < 90 && (
                <p className="text-base font-semibold text-gray-900">
                  Order fulfillment rate is low at <span className="text-red-600">{enrichedData.orders.fulfillmentRate}%</span>.
                  <Button
                    variant="link"
                    className="ml-2 text-primary"
                    onClick={() => router.push('/admin/orders?filter=pending')}
                    aria-label="View pending orders"
                  >
                    Review Orders
                  </Button>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Business Insights (KPIs) */}
        <Card className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg animate-in fade-in-20 duration-700">
          <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent flex justify-between items-center">
            <CardTitle className="text-2xl font-extrabold text-primary tracking-tight">Business Insights</CardTitle>
            <Select value={dateRange} onValueChange={setDateRange} aria-label="Select KPI date range">
              <SelectTrigger className="h-10 rounded-full bg-white/95 border-gray-200/30 w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-lg border-gray-100/20">
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative group">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                  {enrichedData.orders.revenue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center">
                  {enrichedData.orders.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" aria-hidden="true" />
                  )}
                  {enrichedData.orders.revenueGrowth}% vs. last period
                </p>
                <div className="absolute hidden group-hover:block bg-gray-900/90 text-white text-xs rounded-lg p-2 -top-10 left-1/2 transform -translate-x-1/2 z-10">
                  Total revenue from all orders in the selected period.
                </div>
              </div>
              <div className="relative group">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Average Order Value</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                  {enrichedData.orders.avgValue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                </p>
                <p className="text-sm text-gray-600 mt-1">Based on {enrichedData.orders.total} orders</p>
                <div className="absolute hidden group-hover:block bg-gray-900/90 text-white text-xs rounded-lg p-2 -top-10 left-1/2 transform -translate-x-1/2 z-10">
                  Average revenue per order.
                </div>
              </div>
              <div className="relative group">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Customer Retention</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                  {enrichedData.users.retentionRate}%
                </p>
                <p className="text-sm text-gray-600 mt-1">{enrichedData.users.active} active users</p>
                <div className="absolute hidden group-hover:block bg-gray-900/90 text-white text-xs rounded-lg p-2 -top-10 left-1/2 transform -translate-x-1/2 z-10">
                  Percentage of repeat customers in the period.
                </div>
              </div>
              <div className="relative group">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Order Fulfillment</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                  {enrichedData.orders.fulfillmentRate}%
                </p>
                <p className="text-sm text-gray-600 mt-1">{enrichedData.orders.statusBreakdown.completed} completed</p>
                <div className="absolute hidden group-hover:block bg-gray-900/90 text-white text-xs rounded-lg p-2 -top-10 left-1/2 transform -translate-x-1/2 z-10">
                  Percentage of orders successfully fulfilled.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg animate-in fade-in-20 duration-700">
            <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Revenue & Orders Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="h-64">
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { mode: 'index', intersect: false },
                    },
                    scales: {
                      x: { title: { display: true, text: 'Date' } },
                      y: { title: { display: true, text: 'Value' }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg animate-in fade-in-20 duration-700">
            <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="h-64 flex justify-center">
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}%` } },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg animate-in fade-in-20 duration-700">
            <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Pharmacy Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="h-64">
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { mode: 'index', intersect: false },
                    },
                    scales: {
                      x: { title: { display: true, text: 'Pharmacy' } },
                      y: { title: { display: true, text: 'Orders' }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'Pharmacies', count: enrichedData.pharmacies.total, verified: enrichedData.pharmacies.count, verificationRate: enrichedData.pharmacies.verificationRate, icon: Shield, href: '/admin/pharmacies' },
            { title: 'Medications', count: enrichedData.medications.total, lowStock: enrichedData.medications.lowStock, turnoverRate: enrichedData.medications.turnoverRate, icon: Pill, href: '/admin/medications' },
            { title: 'Prescriptions', count: enrichedData.prescriptions.total, pending: enrichedData.prescriptions.pending, avgProcessingTime: enrichedData.prescriptions.avgProcessingTime, icon: FileText, href: '/admin/prescriptions' },
            { title: 'Users', count: enrichedData.users.total, active: enrichedData.users.active, retentionRate: enrichedData.users.retentionRate, icon: Users, href: '/admin/pharmacy-users' },
            { title: 'Orders', count: enrichedData.orders.total, avgValue: enrichedData.orders.avgValue, fulfillmentRate: enrichedData.orders.fulfillmentRate, icon: Package, href: '/admin/orders' },
          ].map((item, index) => (
            <Card
              key={item.title}
              className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg transition-all duration-700 card-hover animate-in fade-in-20 neonGlow"
              style={{ animationDelay: `${0.2 * index}s` }}
              onClick={() => router.push(item.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
              aria-label={`Navigate to ${item.title}: ${item.count} total`}
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-primary/25 rounded-br-full opacity-70" />
              <CardHeader className="p-6 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="flex items-center text-xl font-extrabold text-primary tracking-tight">
                  <item.icon className="h-10 w-10 mr-3 text-primary/90 transition-transform duration-500 hover:scale-125" aria-hidden="true" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse">
                  {item.count}
                </p>
                {item.verified !== undefined && <p className="text-base font-semibold text-gray-700 mt-3">Verified: {item.verified} ({item.verificationRate}%)</p>}
                {item.lowStock !== undefined && <p className="text-base font-semibold text-gray-700 mt-3">Low Stock: {item.lowStock} (Turnover: {item.turnoverRate}x)</p>}
                {item.pending !== undefined && <p className="text-base font-semibold text-gray-700 mt-3">Pending: {item.pending} (Avg Time: {item.avgProcessingTime}hrs)</p>}
                {item.active !== undefined && <p className="text-base font-semibold text-gray-700 mt-3">Active: {item.active} (Retention: {item.retentionRate}%)</p>}
                {item.avgValue !== undefined && (
                  <p className="text-base font-semibold text-gray-700 mt-3">
                    AOV: {item.avgValue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} (Fulfillment: {item.fulfillmentRate}%)
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg transition-all duration-700 animate-in fade-in-20">
          <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight flex items-center">
              <Package className="h-8 w-8 mr-3 text-primary/90 animate-spin-slow" aria-hidden="true" />
              Recent Orders
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-10 rounded-full bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                aria-label="Search orders"
              />
              <Select value={dateRange} onValueChange={setDateRange} aria-label="Select date range">
                <SelectTrigger className="h-10 rounded-full bg-white/95 border-gray-200/30">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border-gray-100/20">
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-10 px-4 rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                onClick={() => alert('Exporting orders...')} // Replace with actual export logic
                aria-label="Export orders"
              >
                <Download className="h-5 w-5 mr-2" aria-hidden="true" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 border-b border-gray-100/20">
                    <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">ID</TableHead>
                    <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Tracking Code</TableHead>
                    <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Patient</TableHead>
                    <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Total Price</TableHead>
                    <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Status</TableHead>
                    <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-gray-500 text-center text-lg font-medium py-8">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order, index) => (
                      <TableRow
                        key={order.id}
                        className="border-b border-gray-100/10 transition-all duration-300 hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] animate-in fade-in-20 cursor-pointer"
                        style={{ animationDelay: `${0.1 * index}s` }}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/orders/${order.id}`)}
                        aria-label={`View order details for ID ${order.id}`}
                      >
                        <TableCell className="text-base font-medium text-gray-900 py-4 truncate max-w-[100px]">{order.id}</TableCell>
                        <TableCell className="text-base font-medium text-gray-900 py-4 truncate max-w-[150px]">{order.trackingCode}</TableCell>
                        <TableCell className="text-base font-medium text-gray-900 py-4 truncate max-w-[150px]">{order.patientIdentifier}</TableCell>
                        <TableCell className="text-base font-medium text-gray-900 py-4">
                          {order.totalPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                        </TableCell>
                        <TableCell className="text-base font-medium py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              order.status === 'pending' ? 'bg-yellow-100/50 text-yellow-700' :
                              order.status === 'completed' ? 'bg-green-100/50 text-green-700' :
                              'bg-red-100/50 text-red-700'
                            }`}
                          >
                            {order.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-base font-medium text-gray-900 py-4 truncate max-w-[120px]">
                          {new Date(order.createdAt).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            onClick={() => router.push('/admin/admin-users')}
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-300 animate-pulse"
            aria-label="Manage Admin Users"
          >
            Manage Admin Users
          </Button>
          <Button
            onClick={() => router.push('/admin/pharmacy-users')}
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-300 animate-pulse"
            aria-label="Manage Pharmacy Users"
          >
            Manage Pharmacy Users
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)]"
            onClick={() => alert('Exporting KPI report...')} // Replace with actual export logic
            aria-label="Export KPI report"
          >
            <Download className="h-5 w-5 mr-2" aria-hidden="true" />
            Export KPIs
          </Button>
        </div>
      </div>
    </div>
  );
}