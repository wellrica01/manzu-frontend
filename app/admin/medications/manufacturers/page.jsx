"use client";
import { useEffect, useState } from "react";
import Dialog from "../../../../components/Dialog";
import ManufacturerForm from "./ManufacturerForm";
import {
  fetchManufacturers,
  deleteManufacturer,
  createManufacturer,
  updateManufacturer,
} from "./api";
import {
  Loader2,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
} from "lucide-react";
import DataTable from "../../components/DataTable";

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState([]);
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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingManufacturer, setEditingManufacturer] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Fetch with pagination + search
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
        };
        const res = await fetchManufacturers(params);
        setManufacturers(res.manufacturers || []);
        if (res.pagination) setPagination(res.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pagination.page, search]);

  // Handle add/edit
  const handleAddOrEdit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingManufacturer) {
        await updateManufacturer(editingManufacturer.id, data);
      } else {
        await createManufacturer(data);
      }
      setDialogOpen(false);
      setEditingManufacturer(null);
      setPagination((prev) => ({ ...prev, page: 1 })); // reload first page
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    setDeleteLoading(true);
    setDeleteSuccess(false);
    try {
      await deleteManufacturer(id);
      setDeleteSuccess(true);
      setManufacturers((prev) => prev.filter((m) => m.id !== id));
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

  const handleEditClick = (manufacturer) => {
    setEditingManufacturer(manufacturer);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Add/Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingManufacturer(null);
        }}
        title={editingManufacturer ? "Edit Manufacturer" : "Add Manufacturer"}
      >
        <ManufacturerForm
          initialData={editingManufacturer || {}}
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
        />
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Manufacturers</h1>
        <button
          onClick={() => {
            setEditingManufacturer(null);
            setDialogOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" />
          Add Manufacturer
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        title="Manufacturers"
        loading={loading}
        error={error}
        data={manufacturers}
        columns={["ID", "Name", "Country", "Contact Info", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        pagination={pagination}
        onPageChange={(newPage) =>
          setPagination((prev) => ({ ...prev, page: newPage }))
        }
      >
        {manufacturers.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-4">
              No manufacturers found.
            </td>
          </tr>
        ) : (
          manufacturers.map((m) => (
            <tr key={m.id} className="border-b last:border-0">
              <td className="py-2 px-3 font-medium text-gray-900">{m.id}</td>
              <td className="py-2 px-3">{m.name}</td>
              <td className="py-2 px-3">{m.country}</td>
              <td className="py-2 px-3">{m.contactInfo}</td>
              <td className="py-2 px-3 flex gap-2">
                <button
                  className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#1ABA7F]"
                  title="Edit"
                  onClick={() => handleEditClick(m)}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(m.id)}
                  className="p-1 rounded hover:bg-red-100 text-red-600"
                  title="Delete"
                  disabled={deleteLoading && deleteId === m.id}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Success toast */}
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <CheckCircle className="w-5 h-5" /> Manufacturer deleted successfully.
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteId && (
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          title="Confirm Delete"
        >
          <div className="mb-4">
            Are you sure you want to delete this manufacturer?
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setDeleteId(null)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              onClick={() => handleDelete(deleteId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
