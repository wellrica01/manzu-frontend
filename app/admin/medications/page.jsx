"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, Eye, Edit, Trash2, Plus, CheckCircle } from "lucide-react";
import { fetchMedications, deleteMedication } from "./api";

const brandBlue = "#225F91";
const brandGreen = "#1ABA7F";

function ConfirmDialog({ open, onClose, onConfirm, loading, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-[#1ABA7F]/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span className="font-semibold text-lg text-[#225F91]">Confirm Delete</span>
        </div>
        <div className="mb-6 text-gray-700">{message || "Are you sure you want to delete this medication? This action cannot be undone."}</div>
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

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [prescriptionRequired, setPrescriptionRequired] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Fetch all categories for filter dropdown (from medications list)
  useEffect(() => {
    if (medications.length > 0) {
      // Extract unique category names from categories array in each medication
      const uniqueCategories = Array.from(new Set(
        medications.flatMap((m) =>
          Array.isArray(m.categories)
            ? m.categories.map((cat) => cat.category?.name).filter(Boolean)
            : []
        )
      ));
      setAllCategories(uniqueCategories);
    }
  }, [medications]);

  useEffect(() => {
    async function loadMedications() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
          ...(category ? { category } : {}),
          ...(prescriptionRequired ? { prescriptionRequired } : {}),
        };
        const data = await fetchMedications(params);
        setMedications(data.medications);
        setPagination(data.pagination);
      } catch (e) {
        setError("Failed to load medications.");
      } finally {
        setLoading(false);
      }
    }
    loadMedications();
    // eslint-disable-next-line
  }, [pagination.page, search, category, prescriptionRequired]);

  function handlePageChange(newPage) {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      await deleteMedication(id);
      setDeleteSuccess(true);
      setMedications((prev) => prev.filter((m) => m.id !== id));
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
        <h1 className="text-2xl font-bold text-[#225F91]">Medications</h1>
        <Link
          href="/admin/medications/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </Link>
      </div>
      <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search by name or generic name..."
              value={search}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                setSearch(e.target.value);
              }}
              className="w-full sm:w-64 px-4 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                setCategory(e.target.value);
              }}
              className="px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            >
              <option value="">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={prescriptionRequired}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                setPrescriptionRequired(e.target.value);
              }}
              className="px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            >
              <option value="">All</option>
              <option value="true">Prescription Required</option>
              <option value="false">No Prescription</option>
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
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Generic Name</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Manufacturer</th>
                  <th className="py-2 px-3">Form</th>
                  <th className="py-2 px-3">Dosage</th>
                  <th className="py-2 px-3">Prescription</th>
                  <th className="py-2 px-3">Created</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.length > 0 ? (
                  medications.map((med) => (
                    <tr key={med.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium text-gray-900">{med.brandName}</td>
                      <td className="py-2 px-3">{med.genericMedication?.name || ""}</td>
                      <td className="py-2 px-3">
                        {Array.isArray(med.categories)
                          ? med.categories.map(cat => cat.category?.name).filter(Boolean).join(", ")
                          : ""}
                      </td>
                      <td className="py-2 px-3">{med.manufacturer?.name || ""}</td>
                      <td className="py-2 px-3">{med.form}</td>
                      <td className="py-2 px-3">{med.strengthValue ? `${med.strengthValue} ${med.strengthUnit || ""}` : ""}</td>
                      <td className="py-2 px-3">
                        {med.prescriptionRequired ? (
                          <span className="text-red-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-green-600 font-semibold">No</span>
                        )}
                      </td>
                      <td className="py-2 px-3">{new Date(med.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3 flex gap-2">
                        <Link
                          href={`/admin/medications/${med.id}`}
                          className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#225F91]"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/medications/${med.id}?edit=1`}
                          className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#1ABA7F]"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                          title="Delete"
                          onClick={() => setDeleteId(med.id)}
                          disabled={deleteLoading && deleteId === med.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-gray-500">
                      No medications found.
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
          <CheckCircle className="w-5 h-5" /> Medication deleted successfully.
        </div>
      )}
    </div>
  );
}
