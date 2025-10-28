"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle, CheckCircle, ShoppingCart } from "lucide-react";
import DataTableView from "../../../../components/DataTableView";

const statusOptions = ["ALL", "PENDING", "VERIFIED", "REJECTED"];

function StatusBadge({ status }) {
  let color = "bg-gray-200 text-gray-700";
  if (status === "VERIFIED") color = "bg-green-100 text-green-800";
  else if (status === "PENDING") color = "bg-yellow-100 text-yellow-800";
  else if (status === "REJECTED" || status === "CANCELLED") color = "bg-red-100 text-red-800";
  else if (status === "FILLED") color = "bg-blue-100 text-blue-800";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Fetch prescriptions
  useEffect(() => {
    async function fetchPrescriptions() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const params = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { userIdentifier: search } : {}),
          ...(status ? { status } : {}),
        });
        const res = await fetch(`${API_BASE}/api/admin/prescriptions?${params.toString()}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        setPrescriptions(Array.isArray(data.data?.prescriptions) ? data.data.prescriptions : []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      } catch (e) {
        setError("Failed to load prescriptions.");
      } finally {
        setLoading(false);
      }
    }
    fetchPrescriptions();
  }, [pagination.page, search, status]);

  const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
      const res = await fetch(`${API_BASE}/api/admin/prescriptions/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error: ${res.status}`);
      }
      setDeleteSuccess(true);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      setTimeout(() => setDeleteSuccess(false), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const renderMobileCard = (prescription) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between mb-2">
        <div className="font-semibold">Prescription ID: {prescription.id}</div>
        <StatusBadge status={prescription.status} />
      </div>
         {prescription.status === "REJECTED" && prescription.rejectionReason && (
            <span className="text-xs text-red-600 font-medium my-1 italic">
              Reason: {prescription.rejectionReason}
            </span>
          )}
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <div>Verified: {prescription.status === "VERIFIED" ? "Yes" : "No"}</div>
        <div>Created: {new Date(prescription.createdAt).toLocaleDateString()}</div>
      </div>
      <Link
        href={`/admin/medications/prescriptions/${prescription.id}`}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition text-sm w-full"
      >
        View
      </Link>
    </div>
  );

const columns = [
  { key: "id", label: "ID", render: p => p.id },
  {
    key: "status",
    label: "Status",
    render: p => (
      <div className="flex flex-col items-start">
        <StatusBadge status={p.status} />
        {p.status === "REJECTED" && p.rejectionReason && (
          <span className="text-xs text-red-600 mt-1 italic">
            Reason: {p.rejectionReason}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "verified",
    label: "Verified",
    render: p =>
      p.status === "VERIFIED" ? (
        <span className="text-green-600 font-semibold">Yes</span>
      ) : (
        <span className="text-gray-400">No</span>
      ),
  },
  {
    key: "createdAt",
    label: "Created",
    render: p => new Date(p.createdAt).toLocaleDateString(),
  },
  {
    key: "actions",
    label: "Actions",
    render: p => (
      <Link
        href={`/admin/medications/prescriptions/${p.id}`}
        className="px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition text-sm"
      >
        View
      </Link>
    ),
  },
];


  const filters = [
    {
      value: status,
      onChange: setStatus,
      options: statusOptions.filter(opt => opt !== "ALL").map(opt => ({ value: opt, label: opt })),
      placeholder: "ALL",
    },
  ];

  return (
    <div>
      <DataTableView
        title="Prescriptions"
        description="Manage prescriptions and track their status"
        data={prescriptions}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={v => { setPagination(prev => ({ ...prev, page: 1 })); setSearch(v); }}
        searchPlaceholder="Search by user identifier..."
        filters={filters}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: ShoppingCart,
          title: "No prescriptions found",
          description: search || status !== "ALL" ? "Try adjusting your search or filters." : "Prescriptions will appear here once added.",
          showPrimaryAction: false,
        }}
        className = "p-3"
      />
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <CheckCircle className="w-5 h-5" /> Prescription deleted successfully.
        </div>
      )}
    </div>
  );
}
