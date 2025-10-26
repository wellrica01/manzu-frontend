"use client";
import { useEffect, useState } from "react";
import { 
  Loader2, AlertTriangle, Eye, CheckCircle, Package, RefreshCw,
  ShoppingCart, Clock, Truck, MapPin, User, Phone, Mail,
  Calendar, DollarSign, FileText, AlertCircle, TrendingUp,
  CheckSquare, XCircle, Filter, X, List
} from "lucide-react";
import OrderDetailsDialog from "./components/OrderDetailsDialog";
import DataTableView from "@/components/DataTableView";

const brandGreen = "#1ABA7F";
const brandBlue = "#225F91";
const brandOrange = "#FF6B35";

// Cancellation reasons
const CANCEL_REASONS = [
  "Out of stock",
  "Medication unavailable",
  "Expired prescription",
  "Customer request",
  "Pricing error",
  "Unable to verify prescription",
  "Other"
];

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

async function bulkUpdateOrders(orderIds, status, cancelReason = null) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders/bulk`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderIds, status, cancelReason })
  });
  if (!res.ok) throw new Error('Failed to bulk update orders');
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

// Confirmation Dialog Component
function ConfirmationDialog({ open, onClose, onConfirm, title, message, status, showReasonInput, isLoading }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const finalReason = reason === "Other" ? customReason : reason;
    onConfirm(finalReason);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          
          {showReasonInput && (
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Cancellation Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {CANCEL_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              
              {reason === "Other" && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (showReasonInput && reason === "Other" && !customReason.trim())}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                status === 'CANCELLED' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-[#1ABA7F] hover:bg-[#159e6a]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bulk Action Bar Component
function BulkActionBar({ selectedCount, onAction, onClear, selectedOrders }) {
  const [showActions, setShowActions] = useState(false);
  
  // Determine available actions based on selected orders
  const deliveryMethods = [...new Set(selectedOrders.map(o => o.deliveryMethod?.toLowerCase()))];
  const isMixedDelivery = deliveryMethods.length > 1;
  const isAllPickup = deliveryMethods.length === 1 && deliveryMethods[0] === 'pickup';
  const isAllCourier = deliveryMethods.length === 1 && deliveryMethods[0] === 'courier';

  const actions = [
    { 
      value: 'PROCESSING', 
      label: 'Mark as Processing', 
      icon: Package, 
      color: 'bg-blue-600 hover:bg-blue-700',
      available: true 
    },
    { 
      value: 'SHIPPED', 
      label: 'Mark as Shipped', 
      icon: Truck, 
      color: 'bg-cyan-600 hover:bg-cyan-700',
      available: isAllCourier 
    },
    { 
      value: 'READY_FOR_PICKUP', 
      label: 'Mark as Ready for Pickup', 
      icon: CheckSquare, 
      color: 'bg-purple-600 hover:bg-purple-700',
      available: isAllPickup  
    },
    { 
      value: 'DELIVERED', 
      label: 'Mark as Delivered', 
      icon: CheckCircle, 
      color: 'bg-green-600 hover:bg-green-700',
      available: isAllCourier 
    },
    { 
      value: 'COMPLETED', 
      label: 'Mark as Completed', 
      icon: CheckCircle, 
      color: 'bg-green-600 hover:bg-green-700',
      available: true 
    },
    { 
      value: 'CANCELLED', 
      label: 'Cancel Orders', 
      icon: XCircle, 
      color: 'bg-red-600 hover:bg-red-700',
      available: true 
    },
  ];

  const availableActions = actions.filter(a => a.available);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom">
      <div className="bg-[#225F91] text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          <span className="font-semibold">{selectedCount} selected</span>
        </div>

        {isMixedDelivery && (
          <div className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
            Mixed delivery methods
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="px-4 py-2 bg-white text-[#225F91] rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Bulk Actions
          </button>

          {showActions && (
            <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[240px]">
              {availableActions.map(action => (
                <button
                  key={action.value}
                  onClick={() => {
                    onAction(action.value);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClear}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon: Icon, label, value, color, subtitle, trend }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg md:rounded-lg shadow-sm p-3 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 md:gap-4">
        <div className={`p-2 md:p-3 rounded-lg md:rounded-lg flex-shrink-0`} style={{ background: `${color}20` }}>
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

  // Bulk selection
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    status: null,
    title: '',
    message: ''
  });
  const [bulkLoading, setBulkLoading] = useState(false);

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
      window.history.replaceState({}, '', window.location.pathname + window.location.search.replace(/[?&]orderId=[^&]+/, '').replace(/^&/, '?'));
    }
  }, []);

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

        const total = ordersData.length;
        const pending = ordersData.filter(o => o.status === 'CONFIRMED').length;
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

  // Bulk selection handlers
  const handleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.id));
    }
  };

  const handleBulkAction = (status) => {
    const statusLabels = {
      'PROCESSING': 'Processing',
      'SHIPPED': 'Shipped',
      'READY_FOR_PICKUP': 'Ready for Pickup',
      'DELIVERED': 'Delivered',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };

    setConfirmDialog({
      open: true,
      status,
      title: `${status === 'CANCELLED' ? 'Cancel' : 'Update'} ${selectedOrderIds.length} Order${selectedOrderIds.length > 1 ? 's' : ''}`,
      message: status === 'CANCELLED' 
        ? `Are you sure you want to cancel ${selectedOrderIds.length} order${selectedOrderIds.length > 1 ? 's' : ''}? This action cannot be undone. Paid orders will be automatically refunded.`
        : `Update ${selectedOrderIds.length} order${selectedOrderIds.length > 1 ? 's' : ''} to "${statusLabels[status]}" status?`
    });
  };

  const handleConfirmBulkAction = async (cancelReason) => {
    setBulkLoading(true);
    try {
      const result = await bulkUpdateOrders(
        selectedOrderIds, 
        confirmDialog.status,
        confirmDialog.status === 'CANCELLED' ? cancelReason : null
      );

      const { successful, failed } = result.results;
      
      if (failed.length === 0) {
        showToast(`Successfully updated ${successful.length} order${successful.length > 1 ? 's' : ''}`, 'success');
      } else if (successful.length === 0) {
        showToast(`Failed to update all orders`, 'error', 5000);
      } else {
        showToast(`Updated ${successful.length} order${successful.length > 1 ? 's' : ''}, ${failed.length} failed`, 'warning', 5000);
      }

      setSelectedOrderIds([]);
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      showToast('Failed to perform bulk action', 'error');
      console.error('Bulk action error:', err);
    } finally {
      setBulkLoading(false);
      setConfirmDialog({ open: false, status: null, title: '', message: '' });
    }
  };

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
      case 'completed':
        colorClass = 'bg-green-100 text-green-800 border-green-300';
        Icon = CheckCircle;
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

  const renderMobileCard = (order) => (
    <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          <input
            type="checkbox"
            checked={selectedOrderIds.includes(order.id)}
            onChange={() => handleSelectOrder(order.id)}
            className="w-4 h-4 text-[#1ABA7F] border-gray-300 rounded focus:ring-[#1ABA7F]"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-[#225F91]" />
              <h3 className="font-bold text-sm text-gray-900">Order #{order.sn}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <User className="w-3 h-3" />
              <span className="truncate">{order.name}</span>
            </div>
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

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedOrderIds.length === orders.length && orders.length > 0}
          onChange={handleSelectAll}
          className="w-4 h-4 text-[#1ABA7F] border-gray-300 rounded focus:ring-[#1ABA7F]"
        />
      ),
      render: (order) => (
        <input
          type="checkbox"
          checked={selectedOrderIds.includes(order.id)}
          onChange={() => handleSelectOrder(order.id)}
          className="w-4 h-4 text-[#1ABA7F] border-gray-300 rounded focus:ring-[#1ABA7F]"
        />
      ),
      cellClassName: 'whitespace-nowrap'
    },
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

  const filters = [
    {
      value: statusFilter,
      onChange: (value) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setStatusFilter(value);
      },
      options: [
        { value: "CONFIRMED", label: "Pending" },
        { value: "PROCESSING", label: "Processing" },
        { value: "SHIPPED", label: "Shipped" },
        { value: "DELIVERED", label: "Delivered" },
        { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
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

  const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Loading overlay for deep link */}
      {loadingSpecificOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#1ABA7F] animate-spin" />
            <p className="text-lg font-semibold text-gray-900">Loading order...</p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, status: null, title: '', message: '' })}
        onConfirm={handleConfirmBulkAction}
        title={confirmDialog.title}
        message={confirmDialog.message}
        status={confirmDialog.status}
        showReasonInput={confirmDialog.status === 'CANCELLED'}
        isLoading={bulkLoading}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedOrderIds.length}
        onAction={handleBulkAction}
        onClear={() => setSelectedOrderIds([])}
        selectedOrders={selectedOrders}
      />

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
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg md:rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg md:rounded-lg bg-white shadow-sm flex-shrink-0">
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
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg md:rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg md:rounded-lg bg-white shadow-sm flex-shrink-0">
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
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
        description={`Showing ${orders.length} order${orders.length !== 1 ? 's' : ''}${selectedOrderIds.length > 0 ? ` · ${selectedOrderIds.length} selected` : ''}`}
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