"use client";
import { useState, useEffect } from "react";
import Dialog from "../../components/Dialog";
import DataTable from "../../components/DataTable"; // ✅ new import
import ChemicalSubstanceForm from "./ChemicalSubstanceForm";
import {
  fetchChemicalSubstances,
  createChemicalSubstance,
  updateChemicalSubstance,
  deleteChemicalSubstance,
} from "./api";
import {
  Loader2,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
} from "lucide-react";

export default function ChemicalSubstancesPage() {
  const [chemicalSubstances, setChemicalSubstances] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [chemicalClass, setChemicalClass] = useState("");
  const [allClasses, setAllClasses] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingSubstance, setEditingSubstance] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Fetch data with pagination, search, filter
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
          ...(chemicalClass ? { class: chemicalClass } : {}),
        };
        const res = await fetchChemicalSubstances(params);
        setChemicalSubstances(res.chemicalSubstances || []);
        if (res.pagination) setPagination(res.pagination);

        const uniqueClasses = Array.from(
          new Set(res.chemicalSubstances.map((c) => c.ChemicalClass?.name).filter(Boolean))
        );
        setAllClasses(uniqueClasses);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pagination.page, search, chemicalClass]);

  const handlePageChange = (newPage) =>
    setPagination((prev) => ({ ...prev, page: newPage }));

  const handleAddOrEdit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingSubstance) {
        await updateChemicalSubstance(editingSubstance.id, data);
      } else {
        await createChemicalSubstance(data);
      }
      setDialogOpen(false);
      setEditingSubstance(null);
      setPagination((prev) => ({ ...prev, page: 1 })); // reload
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingSubstance(null);
        }}
        title={editingSubstance ? "Edit Chemical Substance" : "Add Chemical Substance"}
      >
        <ChemicalSubstanceForm
          initialData={editingSubstance || {}}
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
        />
      </Dialog>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Chemical Substances</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" />
          Add Chemical Substance
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        title="Chemical Substances"
        loading={loading}
        error={error}
        data={chemicalSubstances}
        columns={["SN", "Name", "ATC Code", "Chemical Class", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        pagination={pagination}
        onPageChange={handlePageChange}
      >
        {chemicalSubstances.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-4">
              No chemical substances found.
            </td>
          </tr>
        ) : (
          chemicalSubstances.map((c, index) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2 px-3">{index + 1}</td>
              <td className="py-2 px-3">{c.name}</td>
              <td className="py-2 px-3">{c.atcCode}</td>
              <td className="py-2 px-3">{c.ChemicalClass?.name || "-"}</td>
              <td className="py-2 px-3 flex gap-2">
                <button
                  className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#1ABA7F]"
                  onClick={() => {
                    setEditingSubstance(c);
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

      {/* Success toast */}
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <CheckCircle className="w-5 h-5" /> Chemical substance deleted successfully.
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
          <div className="mb-4">Are you sure you want to delete this chemical substance?</div>
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
