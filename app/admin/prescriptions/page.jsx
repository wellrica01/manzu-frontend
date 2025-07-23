"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, Eye, Edit, Trash2, CheckCircle } from "lucide-react";

const brandBlue = "#225F91";
const statusOptions = ["ALL", "PENDING", "VERIFIED", "REJECTED"];

function StatusBadge({ status }) {
  let color = "bg-gray-200 text-gray-700";
  if (status === "VERIFIED") color = "bg-green-100 text-green-800";
  else if (status === "PENDING") color = "bg-yellow-100 text-yellow-800";
  else if (status === "REJECTED" || status === "CANCELLED") color = "bg-red-100 text-red-800";
  else if (status === "FILLED") color = "bg-blue-100 text-blue-800";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, loading, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-[#1ABA7F]/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span className="font-semibold text-lg text-[#225F91]">Confirm Delete</span>
        </div>
        <div className="mb-6 text-gray-700">{message || "Are you sure you want to delete this prescription? This action cannot be undone."}</div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

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
          ...(status !== "ALL" ? { status } : {}),
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
        setPrescriptions(data.prescriptions);
        setPagination(data.pagination);
      } catch (e) {
        setError("Failed to load prescriptions.");
      } finally {
        setLoading(false);
      }
    }
    fetchPrescriptions();
    // eslint-disable-next-line
  }, [pagination.page, search, status]);

  function handlePageChange(newPage) {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }

  async function handleDelete(id) {
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
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      setTimeout(() => {
        setDeleteId(null);
        setDeleteSuccess(false);
      }, 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        loading={deleteLoading}
      />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Prescriptions</h1>
      </div>
      <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search by user identifier..."
              value={search}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                setSearch(e.target.value);
              }}
              className="w-full sm:w-64 px-4 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                setStatus(e.target.value);
              }}
              className="px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin w-8 h-8 text-[#1ABA7F]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-red-600">
            <AlertTriangle className="w-8 h-8" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Verified</th>
                  <th className="py-2 px-3">Created</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.length > 0 ? (
                  prescriptions.map((prescription) => (
                    <tr key={prescription.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium text-gray-900">{prescription.userIdentifier}</td>
                      <td className="py-2 px-3"><StatusBadge status={prescription.status} /></td>
                      <td className="py-2 px-3">{prescription.verified ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-gray-400">No</span>}</td>
                      <td className="py-2 px-3">{new Date(prescription.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3">
                        <Link
                          href={`/admin/prescriptions/${prescription.id}`}
                          className="px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No prescriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination Controls */}
        <div className="flex justify-end items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded border border-[#1ABA7F]/30 text-[#225F91] disabled:opacity-50"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="px-3 py-1 rounded border border-[#1ABA7F]/30 text-[#225F91] disabled:opacity-50"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </button>
        </div>
      </Card>
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <CheckCircle className="w-5 h-5" /> Prescription deleted successfully.
        </div>
      )}
    </div>
  );
}
