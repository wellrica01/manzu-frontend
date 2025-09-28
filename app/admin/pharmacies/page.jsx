"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPharmacies, deletePharmacy } from "./api";
import { ShoppingCart, Loader2, AlertTriangle, Eye, Edit, Trash2, Plus, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import DataTableView from "../components/DataTableView";
import Dialog from "../components/Dialog";
import PharmacyForm from "./PharmacyForm";

const brandBlue = "#225F91";
const brandGreen = "#1ABA7F";
const statusOptions = ["VERIFIED", "PENDING", "REJECTED"];

function StatusBadge({ status }) {
  const normalized = status.toLowerCase();
  let color = "bg-gray-200 text-gray-700";
  if (normalized === "verified") color = "bg-green-100 text-green-800";
  else if (normalized === "pending") color = "bg-yellow-100 text-yellow-800";
  else if (normalized === "rejected" || normalized === "suspended")
    color = "bg-red-100 text-red-800";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [stateFilter, setStateFilter] = useState("");
  const [allStates, setAllStates] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch pharmacies
  useEffect(() => {
    async function loadPharmacies() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
          ...(status !== "all" ? { status } : {}),
          ...(stateFilter ? { state: stateFilter } : {}),
        };
        const data = await fetchPharmacies(params);
        setPharmacies(Array.isArray(data.data?.pharmacies) ? data.data.pharmacies : []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });

        // Extract states for filter
        const uniqueStates = Array.from(
          new Set(data.data?.pharmacies.map(p => p.state).filter(Boolean))
        );
        setAllStates(uniqueStates);

      } catch (e) {
        setError("Failed to load pharmacies.");
      } finally {
        setLoading(false);
      }
    }
    loadPharmacies();
  }, [pagination.page, search, status, stateFilter]);

  const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deletePharmacy(id);
      setPharmacies(prev => prev.filter(p => p.id !== id));
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 2000);
    } catch (e) {
      setDeleteError(e.message);
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
        <div>
          <span className="text-gray-500 font-medium">Phone:</span> {pharmacy.phone}
        </div>
        <div>
          <span className="text-gray-500 font-medium">License:</span> {pharmacy.licenseNumber}
        </div>
      </div>
      <div className="flex justify-between items-center text-sm mb-2">
        <span>Active: {pharmacy.isActive ? "Yes" : "No"}</span>
        <span>Created: {new Date(pharmacy.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="pt-2 border-t border-gray-100 flex gap-2">
        <Link href={`/admin/pharmacies/${pharmacy.id}`} className="text-[#225F91] p-1 rounded hover:bg-[#1ABA7F]/10">
          <Eye className="w-4 h-4" />
        </Link>
        <Link href={`/admin/pharmacies/${pharmacy.id}?edit=1`} className="text-[#1ABA7F] p-1 rounded hover:bg-[#1ABA7F]/10">
          <Edit className="w-4 h-4" />
        </Link>
        <button onClick={() => setDeleteId(pharmacy.id)} className="text-red-600 p-1 rounded hover:bg-red-100">
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
    { key: "actions", label: "Actions", render: p => (
      <div className="flex gap-2">
        <Link href={`/admin/pharmacies/${p.id}`} className="text-[#225F91] p-1 rounded hover:bg-[#1ABA7F]/10"><Eye className="w-4 h-4" /></Link>
        <Link href={`/admin/pharmacies/${p.id}?edit=1`} className="text-[#1ABA7F] p-1 rounded hover:bg-[#1ABA7F]/10"><Edit className="w-4 h-4" /></Link>
        <button onClick={() => setDeleteId(p.id)} className="text-red-600 p-1 rounded hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  // Filters
  const filters = [
    {
      value: status,
      onChange: setStatus,
      options: statusOptions.filter(opt => opt !== "all").map(opt => ({ value: opt, label: opt })),
      placeholder: "All Statuses",
    },
    {
      value: stateFilter,
      onChange: setStateFilter,
      options: allStates.map(state => ({ value: state, label: state })),
      placeholder: "All States",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Pharmacies</h1>
        <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition">
          <Plus className="w-4 h-4" /> Add Pharmacy
        </button>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Pharmacy">
        <PharmacyForm mode="create" onSuccess={() => setDialogOpen(false)} />
      </Dialog>

      <DataTableView
        title=""
        description=""
        data={pharmacies}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={v => { setPagination(prev => ({ ...prev, page: 1 })); setSearch(v); }}
        searchPlaceholder="Search by name..."
        filters={filters}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: ShoppingCart,
          title: "No pharmacies found",
          description: search || status !== "all" ? "Try adjusting your search or filters." : "Pharmacies will appear here once added.",
          showPrimaryAction: false,
        }}
      />

      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <CheckCircle className="w-5 h-5" /> Pharmacy deleted successfully.
        </div>
      )}
    </div>
  );
}
