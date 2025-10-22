"use client";
import { useEffect, useState } from "react";
import { 
  Loader2, AlertTriangle, Eye, CheckCircle, Package, RefreshCw,
  ShoppingCart, Clock, Truck, MapPin, User, Phone, Mail,
  Calendar, DollarSign, FileText, AlertCircle, TrendingUp,
  CheckSquare, XCircle, Filter
} from "lucide-react";
import Dialog from "@/components/Dialog";
import OrderDetailsDialog from "./components/OrderDetailsDialog";
import DataTableView from "@/components/DataTableView";

const brandGreen = "#1ABA7F";
const brandBlue = "#225F91";
const brandOrange = "#FF6B35";

// API functions
async function fetchOrders(params) {
  const token = localStorage.getItem('pharmacyToken');
  const queryParams = new URLSearchParams(params).toString();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders?${queryParams}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

async function fetchSpecificOrder(orderId) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('ORDER_NOT_FOUND');
    }
    throw new Error('Failed to fetch order');
  }
  return res.json();
}

function capitalizeWords(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/_/g, ' ');
}

// Helper Components
function StatCard({ icon: Icon, label, value, color, subtitle, trend }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm p-3 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 md:gap-4">
        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl flex-shrink-0`} style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4 md:w-6 md:h-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs md:text-sm font-medium text-gray-600">{label}</div>
          <div className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 md:mt-1">{value}</div>
          {subtitle && (
            <div className="flex items-center gap-1 mt-0.5 md:mt-1">
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : null}
              <span className="text-xs text-gray-500">{subtitle}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EnhancedOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [loadingSpecificOrder, setLoadingSpecificOrder] = useState(false);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    readyOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  });

  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false
  });

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, duration);
  };

  // Handle deep linking to specific order
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
      handleDeepLinkOrder(orderId);
      // Clean up URL after capturing the orderId
      window.history.replaceState({}, '', window.location.pathname + window.location.search.replace(/[?&]orderId=[^&]+/, '').replace(/^&/, '?'));
    }
  }, []);

  // Function to handle deep link order fetching
  async function handleDeepLinkOrder(orderId) {
    setLoadingSpecificOrder(true);
    try {
      const order = await fetchSpecificOrder(orderId);
      setSelectedOrder(order);
      setDialogOpen(true);
      showToast(`Order #${order.sn} loaded successfully`, 'success');
    } catch (err) {
      if (err.message === 'ORDER_NOT_FOUND') {
        showToast('Order not found. It may have been deleted or you don\'t have access to it.', 'error', 5000);
      } else {
        showToast('Failed to load order. Please try again.', 'error');
      }
      console.error('Deep link order error:', err);
    } finally {
      setLoadingSpecificOrder(false);
    }
  }

  // Load orders
  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { search } : {}),
        };

        if (statusFilter) params.status = statusFilter;
        if (deliveryMethodFilter) params.deliveryMethod = deliveryMethodFilter;
        if (dateFilter) params.date = dateFilter;

        const data = await fetchOrders(params);
        const ordersData = data.orders || [];
        setOrders(ordersData);
        setPagination(data.pagination || pagination);

        // Calculate stats
        const total = ordersData.length;
        const pending = ordersData.filter(o => o.status === 'CONFIRMED' || o.status === 'PENDING').length;
        const processing = ordersData.filter(o => o.status === 'PROCESSING').length;
        const ready = ordersData.filter(o => o.status === 'READY_FOR_PICKUP').length;
        const revenue = ordersData.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const avg = total > 0 ? revenue / total : 0;

        setStats({
          totalOrders: total,
          pendingOrders: pending,
          processingOrders: processing,
          readyOrders: ready,
          totalRevenue: revenue,
          avgOrderValue: avg,
        });
      } catch (e) {
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [pagination.page, search, statusFilter, deliveryMethodFilter, dateFilter, refreshCounter]);

  function handlePageChange(newPage) {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
    setRefreshCounter(prev => prev + 1);
  };

  // Quick date filters
  const setQuickDateFilter = (type) => {
    const today = new Date();
    let date = '';
    
    switch(type) {
      case 'today':
        date = today.toISOString().split('T')[0];
        setDateFilter(date);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        date = yesterday.toISOString().split('T')[0];
        setDateFilter(date);
        break;
      case 'clear':
        setDateFilter("");
        break;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Helper to get status badge with icon
  const getStatusBadge = (status) => {
    let colorClass = '';
    let Icon = Clock;
    
    switch (status.toLowerCase()) {
      case 'delivered':
        colorClass = 'bg-green-100 text-green-800 border-green-300';
        Icon = CheckCircle;
        break;
      case 'ready_for_pickup':
        colorClass = 'bg-purple-100 text-purple-800 border-purple-300';
        Icon = CheckSquare;
        break;
      case 'shipped':
        colorClass = 'bg-blue-100 text-blue-800 border-blue-300';
        Icon = Truck;
        break;
      case 'processing':
        colorClass = 'bg-cyan-100 text-cyan-800 border-cyan-300';
        Icon = Package;
        break;
      case 'confirmed':
      case 'pending':
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
        Icon = Clock;
        break;
      case 'cancelled':
        colorClass = 'bg-red-100 text-red-800 border-red-300';
        Icon = XCircle;
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800 border-gray-300';
    }
    
    return (
      <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
        <span className="hidden sm:inline">{capitalizeWords(status)}</span>
        <span className="sm:hidden">{capitalizeWords(status).split(' ')[0]}</span>
      </span>
    );
  };

  // Get delivery badge
  const getDeliveryBadge = (method) => {
    const isPickup = method?.toLowerCase() === 'pickup';
    return (
      <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-xs font-medium ${
        isPickup 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'bg-green-50 text-green-700 border border-green-200'
      }`}>
        {isPickup ? <MapPin className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
        {capitalizeWords(method)}
      </span>
    );
  };

  // Mobile card component
  const renderMobileCard = (order) => (
    <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShoppingCart className="w-3.5 h-3.5 text-[#225F91]" />
            <h3 className="font-bold text-sm text-gray-900">Order #{order.sn}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <User className="w-3 h-3" />
            <span className="truncate">{order.name}</span>
          </div>
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors flex-shrink-0"
          title="View details"
          onClick={() => handleViewDetails(order)}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3 h-3 text-gray-500" />
          <span className="text-gray-700">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <DollarSign className="w-3 h-3 text-gray-500" />
          <span className="font-semibold text-gray-900">₦{order.totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          {getStatusBadge(order.status)}
          {getDeliveryBadge(order.deliveryMethod)}
        </div>
      </div>

      {order.prescription && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
            <FileText className="w-3 h-3" />
            <span className="font-medium">Prescription Required</span>
          </div>
        </div>
      )}
    </div>
  );

  // Table columns
  const columns = [
    {
      key: 'sn',
      label: 'Order #',
      render: (order) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#225F91]" />
          <span className="font-mono font-semibold text-gray-900">#{order.sn}</span>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (order) => (
        <div>
          <div className="font-medium text-gray-900">{order.name}</div>
          {order.phone && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />
              {order.phone}
            </div>
          )}
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'items',
      label: 'Items',
      render: (order) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">{order.items?.length || 0}</div>
          <div className="text-xs text-gray-500">products</div>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'totalPrice',
      label: 'Total',
      render: (order) => (
        <span className="font-bold text-[#1ABA7F]">₦{order.totalPrice.toLocaleString()}</span>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'delivery',
      label: 'Delivery',
      render: (order) => getDeliveryBadge(order.deliveryMethod),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => getStatusBadge(order.status),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'prescription',
      label: 'Prescription',
      render: (order) => (
        order.prescription ? (
          <div className="flex items-center gap-1 text-orange-600">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Yes</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'date',
      label: 'Date',
      render: (order) => (
        <div className="text-sm">
          <div className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order) => (
        <button
          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
          title="View details"
          onClick={() => handleViewDetails(order)}
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
      cellClassName: 'whitespace-nowrap text-sm font-medium'
    }
  ];

  // Filter configurations
  const filters = [
    {
      value: statusFilter,
      onChange: (value) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setStatusFilter(value);
      },
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "CONFIRMED", label: "Confirmed" },
        { value: "PROCESSING", label: "Processing" },
        { value: "SHIPPED", label: "Shipped" },
        { value: "DELIVERED", label: "Delivered" },
        { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
        { value: "CANCELLED", label: "Cancelled" }
      ],
      placeholder: "All Statuses",
      className: "sm:w-48"
    },
    {
      value: deliveryMethodFilter,
      onChange: (value) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setDeliveryMethodFilter(value);
      },
      options: [
        { value: "COURIER", label: "Delivery" },
        { value: "PICKUP", label: "Pickup" }
      ],
      placeholder: "All Delivery Methods",
      className: "sm:w-48"
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Loading overlay for deep link */}
      {loadingSpecificOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#1ABA7F] animate-spin" />
            <p className="text-lg font-semibold text-gray-900">Loading order...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Orders Management
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Process and track online orders from customers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats.totalOrders}
          color={brandBlue}
          subtitle="All time"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pendingOrders}
          color={brandOrange}
          subtitle="Needs attention"
        />
        <StatCard
          icon={Package}
          label="Processing"
          value={stats.processingOrders}
          color="#3B82F6"
          subtitle="In progress"
        />
        <StatCard
          icon={CheckSquare}
          label="Ready"
          value={stats.readyOrders}
          color={brandGreen}
          subtitle="For pickup"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg md:rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white shadow-sm flex-shrink-0">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm font-medium text-gray-600">Total Revenue</div>
              <div className="text-xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
                ₦{stats.totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg md:rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white shadow-sm flex-shrink-0">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm font-medium text-gray-600">Avg Order Value</div>
              <div className="text-xl md:text-3xl font-bold text-gray-900 mt-0.5 md:mt-1">
                ₦{Math.round(stats.avgOrderValue).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden w-full p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#225F91]" />
            <span className="font-semibold text-gray-900">Quick Filters</span>
          </div>
          <span className="text-gray-500">{showFilters ? '−' : '+'}</span>
        </button>

        <div className="hidden md:flex items-center gap-3 p-6 pb-4">
          <Filter className="w-5 h-5 text-[#225F91]" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Filters</h2>
        </div>

        <div className={`${showFilters ? 'block' : 'hidden'} md:block px-4 pb-4 md:px-6 md:pb-6`}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickDateFilter('today')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                dateFilter === new Date().toISOString().split('T')[0]
                  ? 'bg-[#1ABA7F] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Today's Orders</span>
              <span className="sm:hidden">Today</span>
            </button>
            <button
              onClick={() => setQuickDateFilter('yesterday')}
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                setStatusFilter('CONFIRMED');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                statusFilter === 'CONFIRMED'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Pending Action</span>
              <span className="sm:hidden">Pending</span>
            </button>
            <button
              onClick={() => {
                setStatusFilter('PROCESSING');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                statusFilter === 'PROCESSING'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              Processing
            </button>
            <button
              onClick={() => {
                setDateFilter("");
                setStatusFilter("");
                setDeliveryMethodFilter("");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              <span className="hidden sm:inline">Clear All Filters</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <OrderDetailsDialog
        open={dialogOpen}
        onClose={handleCloseDetails}
        order={selectedOrder}
        onStatusUpdate={showToast}
      />

      {/* Main Data Table View */}
      <DataTableView
        title="All Orders"
        description={`Showing ${orders.length} order${orders.length !== 1 ? 's' : ''}`}
        data={orders}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={(value) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(value);
        }}
        searchPlaceholder="Search by customer name, order number..."
        filters={filters}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: Package,
          title: "No orders found",
          description: "Orders from the Manzu platform will appear here",
          showPrimaryAction: false
        }}
        refreshAction={{
          icon: RefreshCw,
          loading: loading,
          onClick: () => setRefreshCounter(prev => prev + 1)
        }}
      />

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`
          fixed bottom-4 md:bottom-6 right-4 md:right-6 left-4 md:left-auto px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center gap-2 shadow-lg z-50
          ${toast.type === "success" ? "bg-green-100 border border-green-300 text-green-800" : ""}
          ${toast.type === "error" ? "bg-red-100 border border-red-300 text-red-800" : ""}
          ${toast.type === "warning" ? "bg-yellow-100 border border-yellow-300 text-yellow-800" : ""}
          animate-in slide-in-from-right
        `}>
          {toast.type === "success" && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
          {toast.type === "warning" && <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
          <span className="font-medium text-sm md:text-base">{toast.message}</span>
        </div>
      )}
    </div>
  );
}