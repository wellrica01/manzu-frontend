"use client";
import { useEffect, useState } from "react";
import { 
  Loader2, AlertTriangle, Receipt, DollarSign, Calendar, 
  CreditCard, Banknote, TrendingUp, Package, Eye, Download,
  Filter, RefreshCw, Clock, CheckCircle, FileText
} from "lucide-react";

const brandGreen = "#1ABA7F";
const brandBlue = "#225F91";

// API functions
async function fetchSales(params) {
  const token = localStorage.getItem('pharmacyToken');
  const queryParams = new URLSearchParams(params).toString();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/sales?${queryParams}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

async function exportSales(params) {
  const token = localStorage.getItem('pharmacyToken');
  const queryParams = new URLSearchParams(params).toString();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/sales/export?${queryParams}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to export sales');
  return res.blob();
}

// Helper Components
function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg md:rounded-lg shadow-sm p-3 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`p-2 md:p-3 rounded-lg md:rounded-lg`} style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4 md:w-6 md:h-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs md:text-sm font-medium text-gray-600">{label}</div>
          <div className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 md:mt-1">{value}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5 md:mt-1">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function SaleDetailsModal({ sale, onClose }) {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-white p-4 md:p-6 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Receipt className="w-5 h-5 md:w-6 md:h-6" />
              <div>
                <h2 className="text-lg md:text-xl font-bold">Sale Details</h2>
                <p className="text-white/80 text-xs md:text-sm">Transaction #{sale.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <span className="text-xl md:text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-xs md:text-sm mb-1">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span>Date & Time</span>
              </div>
              <div className="font-semibold text-sm md:text-base text-gray-900">
                {new Date(sale.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-xs md:text-sm mb-1">
                {sale.paymentMethod === 'CASH' ? <Banknote className="w-3 h-3 md:w-4 md:h-4" /> : <CreditCard className="w-3 h-3 md:w-4 md:h-4" />}
                <span>Payment Method</span>
              </div>
              <div className="font-semibold text-sm md:text-base text-gray-900">{sale.paymentMethod}</div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Package className="w-4 h-4 md:w-5 md:h-5 text-[#225F91]" />
              <h3 className="font-semibold text-sm md:text-base text-gray-900">Items Sold</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium text-sm md:text-base text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                      Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-sm md:text-base text-gray-900">
                      ₦{(item.quantity * item.price).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="pt-3 md:pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-base md:text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-2xl md:text-3xl font-bold text-[#1ABA7F]">
                ₦{sale.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600">Items</div>
              <div className="text-lg md:text-xl font-bold text-blue-600">
                {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </div>
            <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-600">Revenue</div>
              <div className="text-lg md:text-xl font-bold text-green-600">
                ₦{sale.total.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-2 md:p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-gray-600">Products</div>
              <div className="text-lg md:text-xl font-bold text-purple-600">
                {sale.items.length}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 md:p-6 border-t border-gray-200 flex gap-2 md:gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4971] transition-colors font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Print Receipt</span>
            <span className="sm:hidden">Print</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm md:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PharmacySalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // UI State
  const [selectedSale, setSelectedSale] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    cashSales: 0,
    cardSales: 0,
    avgTransaction: 0,
  });

  // Load sales
  useEffect(() => {
    async function loadSales() {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        
        if (dateFilter) {
          params.date = dateFilter;
        } else if (dateRange.start && dateRange.end) {
          params.startDate = dateRange.start;
          params.endDate = dateRange.end;
        }
        
        if (paymentMethod) params.paymentMethod = paymentMethod;
        if (minAmount) params.minAmount = minAmount;
        if (maxAmount) params.maxAmount = maxAmount;

        const data = await fetchSales(params);
        const salesData = data.sales || [];
        setSales(salesData);

        const total = salesData.length;
        const revenue = salesData.reduce((sum, sale) => sum + sale.total, 0);
        const cash = salesData.filter(s => s.paymentMethod === 'CASH').length;
        const card = salesData.filter(s => s.paymentMethod === 'CARD').length;
        const avg = total > 0 ? revenue / total : 0;

        setStats({
          totalSales: total,
          totalRevenue: revenue,
          cashSales: cash,
          cardSales: card,
          avgTransaction: avg,
        });
      } catch (e) {
        setError("Failed to load sales records.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSales();
  }, [dateFilter, dateRange, paymentMethod, minAmount, maxAmount, refreshCounter]);

  // Export function
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      else if (dateRange.start && dateRange.end) {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }
      if (paymentMethod) params.paymentMethod = paymentMethod;
      
      const blob = await exportSales(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export sales data');
    } finally {
      setExporting(false);
    }
  };

  // Quick date filters
  const setQuickDateFilter = (type) => {
    const today = new Date();
    let date = '';
    
    switch(type) {
      case 'today':
        date = today.toISOString().split('T')[0];
        setDateFilter(date);
        setDateRange({ start: "", end: "" });
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        date = yesterday.toISOString().split('T')[0];
        setDateFilter(date);
        setDateRange({ start: "", end: "" });
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        setDateRange({ 
          start: weekStart.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        });
        setDateFilter("");
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateRange({ 
          start: monthStart.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        });
        setDateFilter("");
        break;
      case 'clear':
        setDateFilter("");
        setDateRange({ start: "", end: "" });
        break;
    }
  };

  // Mobile card render
  const renderMobileCard = (sale) => (
    <div key={sale.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-3.5 h-3.5 text-[#225F91]" />
            <span className="font-semibold text-sm text-gray-900">#{sale.id}</span>
          </div>
          <p className="text-xs text-gray-600">
            {new Date(sale.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <button
          onClick={() => setSelectedSale(sale)}
          className="p-1.5 rounded-full hover:bg-[#1ABA7F]/10 text-[#1ABA7F] transition-colors flex-shrink-0"
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <span className="text-xs text-gray-500">Items</span>
          <p className="font-semibold text-sm text-gray-900">
            {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Products</span>
          <p className="font-semibold text-sm text-gray-900">{sale.items.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          {sale.paymentMethod === 'CASH' ? (
            <Banknote className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span className="text-xs font-medium text-gray-700">{sale.paymentMethod}</span>
        </div>
        <div className="text-lg font-bold text-[#1ABA7F]">
          ₦{sale.total.toLocaleString()}
        </div>
      </div>
    </div>
  );

  if (loading && sales.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin w-12 h-12 text-[#1ABA7F] mx-auto" />
          <p className="text-lg text-gray-600">Loading sales...</p>
        </div>
      </div>
    );
  }

  if (error && sales.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <p className="text-xl font-semibold text-red-600">{error}</p>
          <button 
            onClick={() => setRefreshCounter(prev => prev + 1)}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Sales Records
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Track and analyze your POS sales history</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || sales.length === 0}
          className="px-3 md:px-4 py-2 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4971] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2 text-sm md:text-base flex-shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        <StatCard
          icon={Receipt}
          label="Total Sales"
          value={stats.totalSales}
          color={brandBlue}
          subtitle="Transactions"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          color={brandGreen}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Transaction"
          value={`₦${Math.round(stats.avgTransaction).toLocaleString()}`}
          color="#7C3AED"
        />
        <StatCard
          icon={Banknote}
          label="Cash Sales"
          value={stats.cashSales}
          color="#10B981"
          subtitle={`${stats.totalSales > 0 ? Math.round((stats.cashSales / stats.totalSales) * 100) : 0}% of total`}
        />
        <StatCard
          icon={CreditCard}
          label="Card Sales"
          value={stats.cardSales}
          color="#3B82F6"
          subtitle={`${stats.totalSales > 0 ? Math.round((stats.cardSales / stats.totalSales) * 100) : 0}% of total`}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden w-full p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#225F91]" />
            <span className="font-semibold text-gray-900">Filters</span>
          </div>
          <span className="text-gray-500">{showFilters ? '−' : '+'}</span>
        </button>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-3 p-6 pb-4">
          <Filter className="w-5 h-5 text-[#225F91]" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        {/* Filter Content */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block px-4 pb-4 md:px-6 md:pb-6`}>
          {/* Quick Date Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setQuickDateFilter('today')}
              className={`px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                dateFilter === new Date().toISOString().split('T')[0]
                  ? 'bg-[#1ABA7F] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setQuickDateFilter('yesterday')}
              className="px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={() => setQuickDateFilter('week')}
              className="px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setQuickDateFilter('month')}
              className="px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => setQuickDateFilter('clear')}
              className="px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Clear Dates
            </button>
          </div>

          {/* Filter Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Specific Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setDateRange({ start: "", end: "" });
                }}
                className="w-full px-2.5 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Date Range Start</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setDateFilter("");
                }}
                className="w-full px-2.5 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Date Range End</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setDateFilter("");
                }}
                className="w-full px-2.5 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              >
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Min Amount (₦)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Max Amount (₦)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="∞"
                className="w-full px-2.5 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Sales History</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5">
              Showing {sales.length} transaction{sales.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setRefreshCounter(prev => prev + 1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-3 md:p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin w-10 h-10 text-[#1ABA7F] mx-auto" />
              <p className="text-gray-600 mt-3">Loading sales...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No sales found</h3>
              <p className="text-sm md:text-base text-gray-600">No sales match your current filters</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {sales.map((sale) => renderMobileCard(sale))}
            </div>
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}