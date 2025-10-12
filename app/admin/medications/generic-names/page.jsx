"use client";
import { useState, useEffect } from "react";
import Dialog from "../../../../components/Dialog";
import GenericNameForm from "./GenericNameForm";
import {
  fetchGenericNames,
  createGenericName,
  updateGenericName,
} from "./api";
import { Plus, Edit } from "lucide-react";
import DataTable from "../../components/DataTable";

export default function GenericNamesPage() {
  const [genericNames, setGenericNames] = useState([]);
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
  const [editingGeneric, setEditingGeneric] = useState(null);

  // Fetch with search & pagination
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { name: search } : {}),
        };
        const res = await fetchGenericNames(params);
        setGenericNames(res.genericNames || []);
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
      if (editingGeneric) {
        await updateGenericName(editingGeneric.id, data);
      } else {
        await createGenericName(data);
      }
      setDialogOpen(false);
      setEditingGeneric(null);
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
          setEditingGeneric(null);
        }}
        title={editingGeneric ? "Edit Generic Name" : "Add Generic Name"}
      >
        <GenericNameForm
          initialData={editingGeneric || {}}
          onSubmit={handleAddOrEdit}
          loading={formLoading}
          error={formError}
        />
      </Dialog>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Generic Names</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" /> Add Generic Name
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        title="Generic Names"
        loading={loading}
        error={error}
        data={genericNames}
        columns={["SN", "Name", "Description", "Actions"]}
        search={search}
        onSearchChange={(val) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(val);
        }}
        pagination={pagination}
        onPageChange={handlePageChange}
      >
        {genericNames.length === 0 ? (
          <tr>
            <td colSpan={4} className="text-center py-4">
              No generic names found.
            </td>
          </tr>
        ) : (
          genericNames.map((g, index) => (
            <tr key={g.id} className="border-b last:border-0">
              <td className="py-2 px-3 font-medium text-gray-900">{index + 1}</td>
              <td className="py-2 px-3">{g.name}</td>
              <td className="py-2 px-3">{g.description || "-"}</td>
              <td className="py-2 px-3">
                <button
                  className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#1ABA7F]"
                  onClick={() => {
                    setEditingGeneric(g);
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
