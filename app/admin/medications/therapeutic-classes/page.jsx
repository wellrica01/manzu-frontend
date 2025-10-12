"use client";
import { useState, useEffect } from "react";
import Dialog from "../../../../components/Dialog";
import TherapeuticClassForm from "./TherapeuticClassForm";
import {
  fetchTherapeuticClasses,
  createTherapeuticClass,
  updateTherapeuticClass,
} from "./api";
import { fetchAnatomicalClasses } from "../anatomical-classes/api";
import { Plus, Edit } from "lucide-react";
import DataTable from "../../components/DataTable";

export default function TherapeuticClassesPage() {
  const [therapeuticClasses, setTherapeuticClasses] = useState([]);
  const [anatomicalClasses, setAnatomicalClasses] = useState([]);
  const [allAnatomicalOptions, setAllAnatomicalOptions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [anatFilter, setAnatFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  // Fetch classes with search/filter/pagination
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
          ...(anatFilter ? { anatomicalClassId: anatFilter } : {}),
        };
        const theraRes = await fetchTherapeuticClasses(params);
        setTherapeuticClasses(theraRes.therapeuticClasses || []);
        if (theraRes.pagination) setPagination(theraRes.pagination);

        const anatRes = await fetchAnatomicalClasses();
        setAnatomicalClasses(anatRes.anatomicalClasses || []);
        setAllAnatomicalOptions(
          anatRes.anatomicalClasses.map((a) => ({
            value: a.id,
            label: a.name,
          }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pagination.page, search, anatFilter]);

  const handlePageChange = (newPage) =>
    setPagination((prev) => ({ ...prev, page: newPage }));

  const handleAddOrEdit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingClass) {
        await updateTherapeuticClass(editingClass.id, data);
      } else {
        await createTherapeuticClass(data);
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

  return (
    <div className="space-y-8">
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? "Edit Therapeutic Class" : "Add Therapeutic Class"}
      >
        <TherapeuticClassForm
          initialData={editingClass || {}}
          anatomicalClasses={anatomicalClasses}
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
        />
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Therapeutic Classes</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" /> Add Therapeutic Class
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        title="Therapeutic Classes"
        loading={loading}
        error={error}
        data={therapeuticClasses}
        columns={["SN", "ATC Code", "Name", "Anatomical Class", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        filters={[
          {
            label: "Anatomical Class",
            value: anatFilter,
            onChange: (val) => {
              setPagination((prev) => ({ ...prev, page: 1 }));
              setAnatFilter(val);
            },
            options: [{ value: "", label: "All Classes" }].concat(allAnatomicalOptions),
          },
        ]}
        pagination={pagination}
        onPageChange={handlePageChange}
      >
        {therapeuticClasses.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-4">
              No therapeutic classes found.
            </td>
          </tr>
        ) : (
          therapeuticClasses.map((c, i) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2 px-3">{i + 1}</td>
              <td className="py-2 px-3">{c.atcCode}</td>
              <td className="py-2 px-3">{c.name}</td>
              <td className="py-2 px-3">{c.AnatomicalClass?.name || "-"}</td>
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
