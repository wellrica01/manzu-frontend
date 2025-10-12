"use client";
import { useEffect, useState } from "react";
import { 
  Loader2, AlertTriangle, Receipt, DollarSign, Calendar, 
  CreditCard, Banknote, TrendingUp, Package, Eye, Download,
  Filter, RefreshCw, Clock, CheckCircle, FileText
} from "lucide-react";
import DataTableView from "@/components/DataTableView";

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl`} style={{ background: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">{label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function SaleDetailsModal({ sale, onClose }) {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-white p-6 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Sale Details</h2>
                <p className="text-white/80 text-sm">Transaction #{sale.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Date & Time</span>
              </div>
              <div className="font-semibold text-gray-900">
                {new Date(sale.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                {sale.paymentMethod === 'CASH' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                <span>Payment Method</span>
              </div>
              <div className="font-semibold text-gray-900">{sale.paymentMethod}</div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#225F91]" />
              <h3 className="font-semibold text-gray-900">Items Sold</h3>
            </div>
            <div className="space-y-3">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ₦{(item.quantity * item.price).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-3xl font-bold text-[#1ABA7F]">
                ₦{sale.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Items</div>
              <div className="text-xl font-bold text-blue-600">
                {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Revenue</div>
              <div className="text-xl font-bold text-green-600">
                ₦{sale.total.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Products</div>
              <div className="text-xl font-bold text-purple-600">
                {sale.items.length}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 px-4 py-3 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4971] transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
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
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // UI State
  const [selectedSale, setSelectedSale] = useState(null);
  const [exporting, setExporting] = useState(false);
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
        
        // Date filters
        if (dateFilter) {
          params.date = dateFilter;
        } else if (dateRange.start && dateRange.end) {
          params.startDate = dateRange.start;
          params.endDate = dateRange.end;
        }
        
        // Other filters
        if (paymentMethod) params.paymentMethod = paymentMethod;
        if (minAmount) params.minAmount = minAmount;
        if (maxAmount) params.maxAmount = maxAmount;

        const data = await fetchSales(params);
        const salesData = data.sales || [];
        setSales(salesData);

        // Calculate stats
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
    <div key={sale.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-[#225F91]" />
            <span className="font-semibold text-gray-900">#{sale.id}</span>
          </div>
          <p className="text-sm text-gray-600">
            {new Date(sale.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setSelectedSale(sale)}
          className="p-2 rounded-full hover:bg-[#1ABA7F]/10 text-[#1ABA7F] transition-colors"
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <span className="text-xs text-gray-500">Items</span>
          <p className="font-semibold text-gray-900">
            {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Products</span>
          <p className="font-semibold text-gray-900">{sale.items.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {sale.paymentMethod === 'CASH' ? (
            <Banknote className="w-4 h-4 text-green-600" />
          ) : (
            <CreditCard className="w-4 h-4 text-blue-600" />
          )}
          <span className="text-sm font-medium text-gray-700">{sale.paymentMethod}</span>
        </div>
        <div className="text-xl font-bold text-[#1ABA7F]">
          ₦{sale.total.toLocaleString()}
        </div>
      </div>
    </div>
  );

  // Table columns
  const columns = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (sale) => (
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#225F91]" />
          <span className="font-mono font-semibold text-gray-900">#{sale.id}</span>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'date',
      label: 'Date & Time',
      render: (sale) => (
        <div>
          <div className="font-medium text-gray-900">
            {new Date(sale.createdAt).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(sale.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'items',
      label: 'Items',
      render: (sale) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
          <div className="text-xs text-gray-500">
            {sale.items.length} product{sale.items.length !== 1 ? 's' : ''}
          </div>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (sale) => (
        <div className="flex items-center gap-2">
          {sale.paymentMethod === 'CASH' ? (
            <>
              <Banknote className="w-4 h-4 text-green-600" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Cash
              </span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Card
              </span>
            </>
          )}
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'total',
      label: 'Total',
      render: (sale) => (
        <span className="text-lg font-bold text-[#1ABA7F]">
          ₦{sale.total.toLocaleString()}
        </span>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (sale) => (
        <button
          onClick={() => setSelectedSale(sale)}
          className="p-2 rounded-md hover:bg-[#1ABA7F]/10 text-[#1ABA7F] transition-colors"
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
      cellClassName: 'whitespace-nowrap'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Sales Records
          </h1>
          <p className="text-gray-600 mt-2">Track and analyze your POS sales history</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || sales.length === 0}
          className="px-4 py-2 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4971] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export CSV
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-[#225F91]" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setQuickDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === new Date().toISOString().split('T')[0]
                ? 'bg-[#1ABA7F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setQuickDateFilter('yesterday')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Yesterday
          </button>
          <button
            onClick={() => setQuickDateFilter('week')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setQuickDateFilter('month')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => setQuickDateFilter('clear')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Clear Dates
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specific Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setDateRange({ start: "", end: "" });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range Start</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange({ ...dateRange, start: e.target.value });
                setDateFilter("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range End</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange({ ...dateRange, end: e.target.value });
                setDateFilter("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount (₦)</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount (₦)</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="∞"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <DataTableView
        title="Sales History"
        description={`Showing ${sales.length} transaction${sales.length !== 1 ? 's' : ''}`}
        data={sales}
        loading={loading}
        error={error}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: Receipt,
          title: "No sales found",
          description: "No sales match your current filters",
          showPrimaryAction: false
        }}
        refreshAction={{
          icon: RefreshCw,
          loading: loading,
          onClick: () => setRefreshCounter(prev => prev + 1)
        }}
        className="p-3"
      />

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