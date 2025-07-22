"use client";
import { useEffect, useState } from 'react';
import Dialog from "../components/Dialog";
import GenericMedicationForm from "./GenericMedicationForm";
import { fetchGenericMedications, deleteGenericMedication, createGenericMedication } from './api';
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, Edit, Trash2, Plus, CheckCircle } from "lucide-react";

export default function GenericMedicationsPage() {
  const [genericMedications, setGenericMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchGenericMedications()
      .then((res) => {
        setGenericMedications(res.genericMedications || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [refresh]);

  const handleAddGenericMedication = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      await createGenericMedication(data);
      setDialogOpen(false);
      setRefresh((r) => r + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  async function handleDelete(id) {
    setDeleteLoading(true);
    setDeleteSuccess(false);
    try {
      await deleteGenericMedication(id);
      setDeleteSuccess(true);
      setGenericMedications((prev) => prev.filter((c) => c.id !== id));
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Generic Medication">
        <GenericMedicationForm onSubmit={handleAddGenericMedication} loading={formLoading} error={formError} />
      </Dialog>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#225F91]">Generic Medications</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
        >
          <Plus className="w-4 h-4" />
          Add Generic Medication
        </button>
      </div>
      <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
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
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">INN</th>
                  <th className="py-2 px-3">ATC Code</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {genericMedications.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4">No generic medications found.</td></tr>
                ) : (
                  genericMedications.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium text-gray-900">{c.id}</td>
                      <td className="py-2 px-3">{c.name}</td>
                      <td className="py-2 px-3">{c.inn}</td>
                      <td className="py-2 px-3">{c.atcCode}</td>
                      <td className="py-2 px-3">{c.description}</td>
                      <td className="py-2 px-3 flex gap-2">
                        <button
                          className="p-1 rounded hover:bg-[#1ABA7F]/10 text-[#1ABA7F]"
                          title="Edit"
                          // onClick={() => handleEdit(c)}
                          disabled
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                          title="Delete"
                          disabled={deleteLoading && deleteId === c.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {deleteSuccess && (
          <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
            <CheckCircle className="w-5 h-5" /> Generic medication deleted successfully.
          </div>
        )}
      </Card>
      {/* Delete confirmation dialog (simple) */}
      {deleteId && (
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
          <div className="mb-4">Are you sure you want to delete this generic medication?</div>
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
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
} 