"use client";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Edit, Trash2, Plus, CheckCircle, Package, RefreshCw, AlertCircle, DollarSign } from "lucide-react";
import Dialog from "@/components/Dialog";
import InventoryForm from "./components/InventoryForm";
import DataTableView from "@/components/DataTableView";

// API functions
async function fetchInventory(params) {
  const token = localStorage.getItem('pharmacyToken');
  const queryParams = new URLSearchParams(params).toString();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications?${queryParams}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}

async function deleteInventoryItem(medicationId) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications/${medicationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete inventory item');
  return res.json();
}

export default function PharmacyInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringSoonCount: 0,
    totalValue: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [prescriptionFilter, setPrescriptionFilter] = useState("");

  const [editingItem, setEditingItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [refreshCounter, setRefreshCounter] = useState(0);

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

  // Load inventory
  useEffect(() => {
    async function loadInventory() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { search } : {}),
          ...(stockFilter === "low" ? { lowStock: true } : {}),
          ...(stockFilter === "out" ? { outOfStock: true } : {}),
          ...(stockFilter === "expiring" ? { expiringSoon: true } : {}),
        };

        if (prescriptionFilter === "true" || prescriptionFilter === "false") {
          params.prescriptionRequired = prescriptionFilter;
        }

        const data = await fetchInventory(params);
        setInventory(data.medications || []);
        setPagination(data.pagination || pagination);
        setSummary(data.summary || summary); 
      } catch (e) {
        setError("Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, [pagination.page, search, stockFilter, prescriptionFilter, refreshCounter]);

  function handlePageChange(newPage) {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }

  const handleEditClick = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      await deleteInventoryItem(id);
      setInventory(prev => prev.filter(item => item.medicationId !== id));
      showToast("Inventory item deleted successfully", "success");
    } catch (e) {
      showToast(e.message || "Failed to delete inventory item", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  // Helper to get stock status badge
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    } else if (stock < 10) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          In Stock
        </span>
      );
    }
  };

  // Helper to format expiry date
  const formatExpiryDate = (date) => {
    if (!date) return "Not set";
    const expiryDate = new Date(date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <span className="text-red-600 font-medium text-xs md:text-sm">Expired</span>;
    } else if (daysUntilExpiry < 30) {
      return <span className="text-orange-600 font-medium text-xs md:text-sm">{expiryDate.toLocaleDateString()}</span>;
    } else {
      return <span className="text-gray-900 text-xs md:text-sm">{expiryDate.toLocaleDateString()}</span>;
    }
  };

  // Helper function to format ingredients
  const formatIngredients = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return "Not specified";
    
    const names = ingredients
      .map((i) => i.activeSubstanceName)
      .filter(Boolean);
    
    if (names.length === 0) return "Not specified";
    if (names.length <= 2) return names.join(" / ");
    
    return (
      <span title={names.join(", ")}>
        {names.slice(0, 2).join(", ")} 
        <span className="text-gray-500 text-xs ml-1">+{names.length - 2} more</span>
      </span>
    );
  };

  // Helper function to format strengths
  const formatStrengths = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return "Not specified";
    
    const strengths = ingredients
      .map((i) => `${i.strengthValue || ""} ${i.strengthUnit || ""}`.trim())
      .filter(Boolean);
    
    if (strengths.length === 0) return "Not specified";
    if (strengths.length <= 2) return strengths.join(" / ");
    
    return (
      <span title={strengths.join(", ")}>
        {strengths.slice(0, 2).join(", ")} 
        <span className="text-gray-500 text-xs ml-1">+{strengths.length - 2} more</span>
      </span>
    );
  };

  // Mobile card component - IMPROVED FOR MOBILE
  const renderMobileCard = (item) => (
    <div key={item.medicationId} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
            {item.brandName || "Unknown"}
          </h3>
          <p className="text-gray-600 text-xs truncate">
            {item.activeSubstances || formatIngredients(item.ingredients)}
          </p>
          <p className="text-gray-500 text-xs truncate">
            {item.manufacturerName || "Unknown Manufacturer"}
          </p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            className="p-1.5 rounded-full hover:bg-[#1ABA7F]/10 text-[#1ABA7F] transition-colors"
            title="Edit inventory"
            onClick={() => handleEditClick(item)}
            aria-label={`Edit ${item.brandName}`}
          >
            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            className="p-1.5 rounded-full hover:bg-red-100 text-red-600 transition-colors"
            title="Delete inventory"
            onClick={() => setDeleteId(item.medicationId)}
            disabled={deleteLoading && deleteId === item.medicationId}
            aria-label={`Delete ${item?.brandName}`}
          >
            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs md:text-sm mb-2">
        <div>
          <span className="text-gray-500 font-medium">Stock:</span>
          <p className="text-gray-900 font-semibold">{item.stock || 0} units</p>
        </div>
        <div>
          <span className="text-gray-500 font-medium">Price:</span>
          <p className="text-gray-900 font-semibold">₦{item.price?.toLocaleString() || 0}</p>
        </div>
        <div>
          <span className="text-gray-500 font-medium">Batch:</span>
          <p className="text-gray-900 truncate">{item.batchNumber || "N/A"}</p>
        </div>
        <div>
          <span className="text-gray-500 font-medium">Expiry:</span>
          <div className="text-gray-900">{formatExpiryDate(item.expiryDate)}</div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium text-xs">Status:</span>
          {getStockBadge(item.stock)}
        </div>
      </div>
    </div>
  );

  // Table columns configuration
  const columns = [
    {
      key: 'medication',
      label: 'Medication',
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900">
            {item?.brandName || "Unknown"}
          </div>
          <div className="text-xs text-gray-500">
            {formatIngredients(item.ingredients)}
          </div>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'form',
      label: 'Form',
      render: (item) => (
        <div>
          <div className="text-sm text-gray-900 max-w-xs">
            {item.form}
          </div>
          <div className="text-xs text-gray-500">
            ({item?.packSizeExpression || ""} {item.packSizeUnit || ""})
          </div>
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{item.stock || 0}</span>
          <span className="text-xs text-gray-500">units</span>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'price',
      label: 'Price',
      render: (item) => (
        <span className="font-semibold text-gray-900">
          ₦{item.price?.toLocaleString() || 0}
        </span>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'batch',
      label: 'Batch Number',
      render: (item) => item.batchNumber || "N/A",
      cellClassName: 'whitespace-nowrap text-sm text-gray-900'
    },
    {
      key: 'expiry',
      label: 'Expiry Date',
      render: (item) => formatExpiryDate(item.expiryDate),
      cellClassName: 'whitespace-nowrap text-sm'
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => getStockBadge(item.stock),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          <button
            className="p-1.5 rounded-md hover:bg-[#1ABA7F]/10 text-[#1ABA7F] transition-colors"
            title="Edit inventory"
            onClick={() => handleEditClick(item)}
            aria-label={`Edit ${item?.brandName}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
            title="Delete inventory"
            onClick={() => setDeleteId(item.medicationId)}
            disabled={deleteLoading && deleteId === item.medicationId}
            aria-label={`Delete ${item?.brandName}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      cellClassName: 'whitespace-nowrap text-sm font-medium'
    }
  ];

  // Filter configurations
  const filters = [
    {
      value: stockFilter,
      onChange: (value) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setStockFilter(value);
      },
      options: [
        { value: "low", label: "Low Stock" },
        { value: "out", label: "Out of Stock" },
        { value: "expiring", label: "Expiring Soon (30 days)" },
      ],
      placeholder: "All Stock Levels",
      className: "sm:w-48"
    },
    {
      value: prescriptionFilter,
      onChange: (value) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setPrescriptionFilter(value);
      },
      options: [
        { value: "true", label: "Prescription Required" },
        { value: "false", label: "OTC" }
      ],
      placeholder: "All Types",
      className: "sm:w-48"
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
        size="lg"
      >
        <InventoryForm
          item={editingItem || {}}
          mode={editingItem ? "edit" : "create"}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingItem(null);
            setRefreshCounter(prev => prev + 1);
            showToast(
              editingItem ? "Inventory updated successfully" : "Inventory item added successfully",
              "success"
            );
          }}
        />
      </Dialog>

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium text-sm md:text-base">Are you sure you want to delete this inventory item?</p>
                <p className="text-red-600 text-xs md:text-sm mt-0.5 md:mt-1">This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 md:gap-3">
            <button
              className="px-3 md:px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium text-sm md:text-base"
              onClick={() => setDeleteId(null)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              className="px-3 md:px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2 text-sm md:text-base"
              onClick={() => handleDelete(deleteId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Deleting...</span>
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </Dialog>
      )}

      {/* Stats Cards - IMPROVED FOR MOBILE */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-white border-2 border-blue-200 rounded-lg md:rounded-lg p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <Package className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs md:text-sm text-gray-600 font-medium">Total Items</div>
              <div className="text-xl md:text-3xl font-bold text-gray-900">{summary.totalItems}</div>
              <div className="text-xs text-gray-500 mt-0.5">In inventory</div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-yellow-200 rounded-lg md:rounded-lg p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs md:text-sm text-gray-600 font-medium">Low Stock</div>
              <div className="text-xl md:text-3xl font-bold text-yellow-600">{summary.lowStockCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">&lt; 10 units</div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-red-200 rounded-lg md:rounded-lg p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-red-100 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs md:text-sm text-gray-600 font-medium">Out of Stock</div>
              <div className="text-xl md:text-3xl font-bold text-red-600">{summary.outOfStockCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">Need restock</div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-green-200 rounded-lg md:rounded-lg p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-green-100 rounded-lg flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs md:text-sm text-gray-600 font-medium">Total Value</div>
              <div className="text-lg md:text-2xl font-bold text-green-600">
                ₦{summary.totalValue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Inventory worth</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Soon Alert - IMPROVED FOR MOBILE */}
      {summary.expiringSoonCount > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg md:rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-orange-900 text-sm md:text-base">
              {summary.expiringSoonCount} medication{summary.expiringSoonCount !== 1 ? 's' : ''} expiring within 30 days
            </p>
            <p className="text-xs md:text-sm text-orange-700 mt-0.5 md:mt-1">
              Review and process these items soon to avoid wastage
            </p>
          </div>
          <button
            onClick={() => {
              setStockFilter('expiring');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-xs md:text-sm flex-shrink-0"
          >
            <span className="hidden sm:inline">View Items</span>
            <span className="sm:hidden">View</span>
          </button>
        </div>
      )}

      {/* Main Data Table View */}
      <DataTableView
        title="Inventory Management"
        description="Manage your pharmacy's medication inventory"
        data={inventory}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={(value) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(value);
        }}
        searchPlaceholder="Search by medication name..."
        filters={filters}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: Package,
          title: "No inventory items found",
          description: "Start by adding your first medication to inventory",
          showPrimaryAction: true
        }}
        primaryAction={{
          label: "Add to Inventory",
          icon: Plus,
          onClick: () => {
            setEditingItem(null);
            setDialogOpen(true);
          }
        }}
        refreshAction={{
          icon: RefreshCw,
          loading: loading,
          onClick: () => setRefreshCounter(prev => prev + 1)
        }}
      />

      {/* Toast Notification - IMPROVED FOR MOBILE */}
      {toast.visible && (
        <div className={`
          fixed bottom-4 md:bottom-6 right-4 md:right-6 left-4 md:left-auto px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center gap-2 shadow-lg z-50
          ${toast.type === "success" ? "bg-green-100 border border-green-300 text-green-800" : ""}
          ${toast.type === "error" ? "bg-red-100 border border-red-300 text-red-800" : ""}
          ${toast.type === "warning" ? "bg-yellow-100 border border-yellow-300 text-yellow-800" : ""}
          animate-in slide-in-from-right
        `}>
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="font-medium text-sm md:text-base">{toast.message}</span>
        </div>
      )}
    </div>
  );
}