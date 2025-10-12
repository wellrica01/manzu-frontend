"use client";
import { useState, useEffect } from "react";
import Dialog from "../../../../components/Dialog";
import AnatomicalClassForm from "./AnatomicalClassForm ";
import {
  fetchAnatomicalClasses,
  createAnatomicalClass,
  updateAnatomicalClass,
} from "./api";
import { Plus, Edit } from "lucide-react";
import DataTable from "../../components/DataTable";

export default function AnatomicalClassesPage() {
  const [anatomicalClasses, setAnatomicalClasses] = useState([]);
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
  const [editingClass, setEditingClass] = useState(null);

  // Fetch data with pagination + search
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
        };
        const res = await fetchAnatomicalClasses(params);
        setAnatomicalClasses(res.anatomicalClasses || []);
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

  const handleAddOrEdit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingClass) {
        await updateAnatomicalClass(editingClass.id, data);
      } else {
        await createAnatomicalClass(data);
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
        title={editingClass ? "Edit Anatomical Class" : "Add Anatomical Class"}
      >
        <AnatomicalClassForm
          initialData={editingClass || {}}
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
        />
      </Dialog>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Anatomical Classes</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" /> Add Anatomical Class
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        title="Anatomical Classes"
        loading={loading}
        error={error}
        data={anatomicalClasses}
        columns={["SN", "ATC Code", "Name", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        pagination={pagination}
        onPageChange={handlePageChange}
      >
        {anatomicalClasses.length === 0 ? (
          <tr>
            <td colSpan={4} className="text-center py-4">
              No anatomical classes found.
            </td>
          </tr>
        ) : (
          anatomicalClasses.map((c, i) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2 px-3">{i + 1}</td>
              <td className="py-2 px-3">{c.atcCode}</td>
              <td className="py-2 px-3">{c.name}</td>
              <td className="py-2 px-3">
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
