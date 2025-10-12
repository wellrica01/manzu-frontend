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

function capitalizeWords(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/_/g, ' ');
}

// Helper Components
function StatCard({ icon: Icon, label, value, color, subtitle, trend }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl`} style={{ background: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">{label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          {subtitle && (
            <div className="flex items-center gap-1 mt-1">
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
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
        {capitalizeWords(status)}
      </span>
    );
  };

  // Get delivery badge
  const getDeliveryBadge = (method) => {
    const isPickup = method?.toLowerCase() === 'pickup';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
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
    <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 mb-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-[#225F91]" />
            <h3 className="font-bold text-gray-900">Order #{order.sn}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-3.5 h-3.5" />
            <span>{order.name}</span>
          </div>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
          title="View details"
          onClick={() => handleViewDetails(order)}
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-semibold text-gray-900">₦{order.totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex flex-col gap-2">
          {getStatusBadge(order.status)}
          {getDeliveryBadge(order.deliveryMethod)}
        </div>
      </div>

      {order.prescription && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1.5 rounded-lg">
            <FileText className="w-3.5 h-3.5" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Orders Management
          </h1>
          <p className="text-gray-600 mt-2">Process and track online orders from customers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white shadow-sm">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                ₦{stats.totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white shadow-sm">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600">Avg Order Value</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                ₦{Math.round(stats.avgOrderValue).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-[#225F91]" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Filters</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setQuickDateFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === new Date().toISOString().split('T')[0]
                ? 'bg-[#1ABA7F] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Today's Orders
          </button>
          <button
            onClick={() => setQuickDateFilter('yesterday')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              setStatusFilter('CONFIRMED');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'CONFIRMED'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Pending Action
          </button>
          <button
            onClick={() => {
              setStatusFilter('PROCESSING');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'PROCESSING'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Processing
          </button>
          <button
            onClick={() => {
              setDateFilter("");
              setStatusFilter("");
              setDeliveryMethodFilter("");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Clear All Filters
          </button>
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
        className="p-3"
      />

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`
          fixed bottom-6 right-6 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg z-50
          ${toast.type === "success" ? "bg-green-100 border border-green-300 text-green-800" : ""}
          ${toast.type === "error" ? "bg-red-100 border border-red-300 text-red-800" : ""}
          ${toast.type === "warning" ? "bg-yellow-100 border border-yellow-300 text-yellow-800" : ""}
          animate-in slide-in-from-right
        `}>
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}