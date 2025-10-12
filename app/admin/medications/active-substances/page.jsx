"use client";
import { useEffect, useState } from "react";
import Dialog from "../../../../components/Dialog";
import ActiveSubstanceForm from "./ActiveSubstanceForm";
import {
  fetchActiveSubstances,
  createActiveSubstance,
  updateActiveSubstance,
  deleteActiveSubstance,
} from "./api";
import { Plus, Edit, Trash2, CheckCircle, Loader2 } from "lucide-react";
import DataTable from "../../components/DataTable";

export default function ActiveSubstancesPage() {
  const [activeSubstances, setActiveSubstances] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [allTypes, setAllTypes] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubstance, setEditingSubstance] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Fetch with filters & pagination
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
          ...(type ? { type } : {}),
        };
        const res = await fetchActiveSubstances(params);
        setActiveSubstances(res.activeSubstances || []);
        if (res.pagination) setPagination(res.pagination);

        const uniqueTypes = Array.from(
          new Set(res.activeSubstances.map((s) => s.type).filter(Boolean))
        );
        setAllTypes(uniqueTypes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pagination.page, search, type]);

  const handlePageChange = (newPage) =>
    setPagination((prev) => ({ ...prev, page: newPage }));

  // Add or Edit
  const handleAddOrEdit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingSubstance) {
        await updateActiveSubstance(editingSubstance.id, data);
      } else {
        await createActiveSubstance(data);
      }
      setDialogOpen(false);
      setEditingSubstance(null);
      setPagination((prev) => ({ ...prev, page: 1 })); // reload from first page
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
        title={editingSubstance ? "Edit Active Substance" : "Add Active Substance"}
      >
        <ActiveSubstanceForm
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
          initialData={editingSubstance}
        />
      </Dialog>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Active Substances</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a]"
        >
          <Plus className="w-4 h-4" /> Add Active Substance
        </button>
      </div>

      {/* Table */}
      <DataTable
        title="Active Substances"
        loading={loading}
        error={error}
        data={activeSubstances}
        columns={["ID", "Name", "Type", "Generic Name", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        filters={[
          {
            label: "Type",
            value: type,
            onChange: (val) => {
              setPagination((prev) => ({ ...prev, page: 1 }));
              setType(val);
            },
            options: [{ value: "", label: "All Types" }].concat(
              allTypes.map((t) => ({ value: t, label: t }))
            ),
          },
        ]}
        pagination={pagination}
        onPageChange={handlePageChange}
      >
        {activeSubstances.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-4">
              No active substances found.
            </td>
          </tr>
        ) : (
          activeSubstances.map((sub) => (
            <tr key={sub.id} className="border-b last:border-0">
              <td className="py-2 px-3">{sub.id}</td>
              <td className="py-2 px-3">{sub.name}</td>
              <td className="py-2 px-3">{sub.type}</td>
              <td className="py-2 px-3">{sub.GenericName?.name || "-"}</td>
              <td className="py-2 px-3 flex gap-2">
                <button
                  className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#1ABA7F]"
                  onClick={() => {
                    setEditingSubstance(sub);
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

    </div>
  );
}
