"use client";
import { useState, useEffect } from "react";
import Dialog from "../../components/Dialog";
import PharmacologicalClassForm from "./PharmacologicalClassForm";
import {
  fetchPharmacologicalClasses,
  createPharmacologicalClass,
  updatePharmacologicalClass,
} from "./api";
import { Plus, Edit} from "lucide-react";
import DataTable from "../../components/DataTable";

export default function PharmacologicalClassesPage() {
  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [therapeuticClass, setTherapeuticClass] = useState("");
  const [allTherapeuticClasses, setAllTherapeuticClasses] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Fetch classes with pagination, search, and filters
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
          ...(therapeuticClass ? { therapeuticClass } : {}),
        };

        const res = await fetchPharmacologicalClasses(params);
        setClasses(res.pharmacologicalClasses || []);
        if (res.pagination) setPagination(res.pagination);

        // collect unique therapeutic class names for filter dropdown
        const uniqueTherapeuticClasses = Array.from(
          new Set(res.pharmacologicalClasses.map((c) => c.TherapeuticClass?.name).filter(Boolean))
        );
        setAllTherapeuticClasses(uniqueTherapeuticClasses);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pagination.page, search, therapeuticClass]);

  const handlePageChange = (newPage) =>
    setPagination((prev) => ({ ...prev, page: newPage }));

  const handleAddOrEdit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingClass) {
        await updatePharmacologicalClass(editingClass.id, data);
      } else {
        await createPharmacologicalClass(data);
      }
      setDialogOpen(false);
      setEditingClass(null);
      setPagination((prev) => ({ ...prev, page: 1 })); // refresh from first page
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
          setEditingClass(null);
        }}
        title={editingClass ? "Edit Pharmacological Class" : "Add Pharmacological Class"}
      >
        <PharmacologicalClassForm
          initialData={editingClass || {}}
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
        />
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Pharmacological Classes</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" />
          Add Pharmacological Class
        </button>
      </div>

      {/* Table with DataTable */}
      <DataTable
        title="Pharmacological Classes"
        loading={loading}
        error={error}
        data={classes}
        columns={["SN", "Name", "ATC Code", "Therapeutic Class", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        filters={[
          {
            label: "Therapeutic Class",
            value: therapeuticClass,
            onChange: (val) => {
              setPagination((prev) => ({ ...prev, page: 1 }));
              setTherapeuticClass(val);
            },
            options: [{ value: "", label: "All Therapeutic Classes" }].concat(
              allTherapeuticClasses.map((t) => ({ value: t, label: t }))
            ),
          },
        ]}
        pagination={pagination}
        onPageChange={handlePageChange}
      >
        {classes.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-4">
              No pharmacological classes found.
            </td>
          </tr>
        ) : (
          classes.map((c, index) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2 px-3 font-medium text-gray-900">{index + 1}</td>
              <td className="py-2 px-3">{c.name}</td>
              <td className="py-2 px-3">{c.atcCode}</td>
              <td className="py-2 px-3">{c.TherapeuticClass?.name || "-"}</td>
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
    </div>
  );
}
