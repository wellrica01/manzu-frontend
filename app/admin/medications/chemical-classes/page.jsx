"use client";
import { useState, useEffect } from "react";
import Dialog from "../../../../components/Dialog";
import ChemicalClassForm from "./ChemicalClassForm";
import {
  fetchChemicalClasses,
  createChemicalClass,
  updateChemicalClass,
  deleteChemicalClass,
} from "./api";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import DataTable from "../../components/DataTable";

export default function ChemicalClassesPage() {
  const [chemicalClasses, setChemicalClasses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Fetch chemical classes with search + pagination
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
        };
        const res = await fetchChemicalClasses(params);
        setChemicalClasses(res.chemicalClasses || []);
        if (res.pagination) setPagination(res.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pagination.page, search]);

  const handlePageChange = (newPage) =>
    setPagination((prev) => ({ ...prev, page: newPage }));

  // Add/Edit
  const handleAddOrEdit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingClass) {
        await updateChemicalClass(editingClass.id, data);
      } else {
        await createChemicalClass(data);
      }
      setDialogOpen(false);
      setEditingClass(null);
      setPagination((prev) => ({ ...prev, page: 1 })); // reload
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    setDeleteLoading(true);
    setDeleteSuccess(false);
    try {
      await deleteChemicalClass(id);
      setDeleteSuccess(true);
      setChemicalClasses((prev) => prev.filter((c) => c.id !== id));
      setTimeout(() => {
        setDeleteId(null);
        setDeleteSuccess(false);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? "Edit Chemical Class" : "Add Chemical Class"}
      >
        <ChemicalClassForm
          initialData={editingClass || {}}
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
        />
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Chemical Classes</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" /> Add Chemical Class
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        title="Chemical Classes"
        loading={loading}
        error={error}
        data={chemicalClasses}
        columns={["SN", "Name", "ATC Code", "Pharmacological Class", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        pagination={pagination}
        onPageChange={handlePageChange}
      >
        {chemicalClasses.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-4">
              No chemical classes found.
            </td>
          </tr>
        ) : (
          chemicalClasses.map((c, index) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2 px-3">{index + 1}</td>
              <td className="py-2 px-3">{c.name}</td>
              <td className="py-2 px-3">{c.atcCode}</td>
              <td className="py-2 px-3">{c.PharmacologicalClass?.name || "-"}</td>
              <td className="py-2 px-3 flex gap-2">
                <button
                  className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#1ABA7F]"
                  onClick={() => {
                    setEditingClass(c);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Success Toast */}
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <CheckCircle className="w-5 h-5" /> Chemical class deleted successfully.
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          title="Confirm Delete"
        >
          <div className="mb-4">
            Are you sure you want to delete this chemical class?
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setDeleteId(null)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
