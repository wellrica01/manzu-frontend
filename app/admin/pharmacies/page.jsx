"use client";
import { useEffect, useState } from "react";
import { fetchPharmacies, deletePharmacy } from "./api";
import { ShoppingCart, Loader2, AlertTriangle, Eye, Edit, Trash2, Plus, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import DataTableView from "../../../components/DataTableView";
import Dialog from "../../../components/Dialog";
import PharmacyForm from "./PharmacyForm";

const statusOptions = ["VERIFIED", "PENDING", "REJECTED"];

function StatusBadge({ status }) {
  const normalized = status?.toLowerCase();
  let color = "bg-gray-200 text-gray-700";
  if (normalized === "verified") color = "bg-green-100 text-green-800";
  else if (normalized === "pending") color = "bg-yellow-100 text-yellow-800";
  else if (normalized === "rejected" || normalized === "suspended") color = "bg-red-100 text-red-800";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase()}
    </span>
  );
}

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("");
  const [allStates, setAllStates] = useState([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Load pharmacies
  useEffect(() => {
    async function loadPharmacies() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(stateFilter ? { state: stateFilter } : {}),
        };

        const data = await fetchPharmacies(params);
        setPharmacies(Array.isArray(data.data?.pharmacies) ? data.data.pharmacies : []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });

        const uniqueStates = Array.from(new Set(data.data?.pharmacies.map(p => p.state).filter(Boolean)));
        setAllStates(uniqueStates);
      } catch (e) {
        setError("Failed to load pharmacies.");
      } finally {
        setLoading(false);
      }
    }
    loadPharmacies();
  }, [pagination.page, search, statusFilter, stateFilter]);

  const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await deletePharmacy(id);
      setPharmacies(prev => prev.filter(p => p.id !== id));
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // Mobile card render
const renderMobileCard = (pharmacy) => (
  <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="font-semibold text-gray-900">{pharmacy.name}</h3>
        <p className="text-gray-600 text-sm">{pharmacy.state}, {pharmacy.lga}</p>
      </div>
      <StatusBadge status={pharmacy.status} />
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
      <div><span className="text-gray-500 font-medium">Phone:</span> {pharmacy.phone}</div>
      <div><span className="text-gray-500 font-medium">License:</span> {pharmacy.licenseNumber}</div>
    </div>
    <div className="flex justify-between items-center text-sm mb-2">
      <span>Active: {pharmacy.isActive ? "Yes" : "No"}</span>
      <span>Created: {new Date(pharmacy.createdAt).toLocaleDateString()}</span>
    </div>
    <div className="pt-2 border-t border-gray-100 flex gap-2">
      {/* View button */}
        <Link
          href={`/admin/pharmacies/${pharmacy.id}`}
          className="text-[#225F91] p-1 rounded hover:bg-[#1ABA7F]/10"
        >
          <Eye className="w-4 h-4" />
        </Link>

      {/* Edit button */}
      <button
        className="text-[#1ABA7F] p-1 rounded hover:bg-[#1ABA7F]/10"
        onClick={() => {
          setEditingPharmacy(pharmacy);
          setDialogOpen(true);
        }}
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Delete button */}
      <button
        className="text-red-600 p-1 rounded hover:bg-red-100"
        onClick={() => setDeleteId(pharmacy.id)}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </Card>
);


  // Table columns
  const columns = [
    { key: "name", label: "Name", render: p => p.name },
    { key: "address", label: "Address", render: p => p.address },
    { key: "state_lga", label: "State/LGA", render: p => `${p.state}, ${p.lga}` },
    { key: "phone", label: "Phone", render: p => p.phone },
    { key: "license", label: "License", render: p => p.licenseNumber },
    { key: "status", label: "Status", render: p => <StatusBadge status={p.status} /> },
    { key: "active", label: "Active", render: p => p.isActive ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-gray-400">No</span> },
    { key: "createdAt", label: "Created", render: p => new Date(p.createdAt).toLocaleDateString() },
    {
  key: "actions",
  label: "Actions",
  render: (p) => (
    <div className="flex gap-2">
      {/* View */}
      <Link
        href={`/admin/pharmacies/${p.id}`}
        className="text-[#225F91] p-1 rounded hover:bg-[#1ABA7F]/10"
      >
        <Eye className="w-4 h-4" />
      </Link>
      {/* Edit */}
      <button
        className="text-[#1ABA7F] p-1 rounded hover:bg-[#1ABA7F]/10"
        onClick={() => {
          setEditingPharmacy(p);
          setDialogOpen(true);
        }}
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Delete */}
      <button
        className="text-red-600 p-1 rounded hover:bg-red-100"
        onClick={() => setDeleteId(p.id)}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

  ];

  const filters = [
    {
      value: statusFilter,
      onChange: setStatusFilter,
      options: statusOptions.map(s => ({ value: s, label: s })),
      placeholder: "All Statuses"
    },
    {
      value: stateFilter,
      onChange: setStateFilter,
      options: allStates.map(state => ({ value: state, label: state })),
      placeholder: "All States"
    }
  ];

  return (
    <div>
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingPharmacy(null);
        }}
        title={editingPharmacy ? "Edit Pharmacy" : "Add Pharmacy"}
        size="lg"
      >
        <PharmacyForm
          mode={editingPharmacy ? "edit" : "create"}
          pharmacy={editingPharmacy || {}}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingPharmacy(null);
            setPagination(prev => ({ ...prev })); // reload
          }}
        />
      </Dialog>

      {/* DataTableView */}
      <DataTableView
        title="Pharmacies"
        description="Manage customer pharmacies, track their details and status"
        data={pharmacies}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={(v) => { setPagination(prev => ({ ...prev, page: 1 })); setSearch(v); }}
        searchPlaceholder="Search by name..."
        filters={filters}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: ShoppingCart,
          title: "No pharmacies found",
          description: search || statusFilter !== "all" ? "Try adjusting your search or filters." : "Pharmacies will appear here once added.",
          showPrimaryAction: false
        }}
        primaryAction={{
          label: "Add Pharmacy",
          icon: Plus,
          onClick: () => {
            setEditingPharmacy(null);
            setDialogOpen(true);
          }
        }}
        className = "p-3"
      />

      {/* Delete success toast */}
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <CheckCircle className="w-5 h-5" /> Pharmacy deleted successfully.
        </div>
      )}
    </div>
  );
}
