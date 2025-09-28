"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, User, Calendar, DollarSign } from "lucide-react";
import { fetchOrders } from "./api";
import DataTableView from "../components/DataTableView";

const statusOptions = [
  'CART', 'PENDING', 
  'PENDING_PRESCRIPTION', 
  'CONFIRMED', 'PROCESSING', 
  'SHIPPED', 'DELIVERED', 
  'READY_FOR_PICKUP', 
  'CANCELLED', 'COMPLETED'
];

function StatusBadge({ status }) {
  const normalized = status?.toLowerCase?.() || "";
  let color = "bg-gray-200 text-gray-700";

  if (normalized === "pending") color = "bg-yellow-100 text-yellow-800";
  else if (normalized === "confirmed") color = "bg-blue-100 text-blue-800";
  else if (normalized === "processing") color = "bg-purple-100 text-purple-800";
  else if (normalized === "shipped") color = "bg-indigo-100 text-indigo-800";
  else if (normalized === "delivered") color = "bg-green-100 text-green-800";
  else if (normalized === "ready_for_pickup") color = "bg-cyan-100 text-cyan-800";
  else if (normalized === "cancelled") color = "bg-red-100 text-red-800";
  else if (normalized === "cart") color = "bg-gray-100 text-gray-800";
  else if (normalized === "completed") color = "bg-green-100 text-green-800";
  else if (normalized === "pending_prescription") color = "bg-orange-100 text-orange-800";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {normalized.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(status ? { status } : {}), 
      };
        const data = await fetchOrders(params);
        setOrders(Array.isArray(data.data?.orders) ? data.data.orders : []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      } catch (e) {
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [pagination.page, search, status]);

  function handlePageChange(newPage) {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }

  // Mobile card component
  const renderMobileCard = (order) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Order #{order.id}</h3>
          <p className="text-gray-600 text-sm">{order.userIdentifier}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-gray-500 font-medium">Total:</span>
            <p className="text-gray-900 font-semibold">
              ₦{order.totalPrice?.toLocaleString?.() ?? order.totalPrice}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-gray-500 font-medium">Created:</span>
            <p className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-100">
        <Link
          href={`/admin/orders/${order.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );

  // Table columns configuration
  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (order) => (
        <div className="font-medium text-gray-900">#{order.id}</div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'userIdentifier',
      label: 'User',
      render: (order) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900">{order.userIdentifier}</span>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'totalPrice',
      label: 'Total Price',
      render: (order) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">
            ₦{order.totalPrice?.toLocaleString?.() ?? order.totalPrice}
          </span>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (order) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition text-sm"
        >
          View Details
        </Link>
      ),
      cellClassName: 'whitespace-nowrap'
    }
  ];

  // Filter configurations
  const filters = [
    {
      value: status,    
      onChange: (value) => setStatus(value),
      options: statusOptions
        .filter(opt => opt !== "ALL") 
        .map(opt => ({ value: opt, label: opt.replace(/_/g, " ") })),
      placeholder: "ALL",  
      className: "sm:w-48"
    }
  ];

  return (
    <DataTableView
      title="Orders"
      description="Manage customer orders and track their status"
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
      searchPlaceholder="Search by user identifier..."
      filters={filters}
      columns={columns}
      mobileCardRender={renderMobileCard}
      emptyState={{
        icon: ShoppingCart,
        title: "No orders found",
        description: search || status !== "ALL" 
          ? "Try adjusting your search criteria or filters to find what you're looking for."
          : "Orders will appear here once customers start placing them.",
        showPrimaryAction: false
      }}
    />
  );
}