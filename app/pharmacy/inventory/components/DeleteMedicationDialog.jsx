import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteMedicationDialog({ open, onClose, medication, onDelete }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleDelete = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch(`http://localhost:5000/api/pharmacy/medications?medicationId=${medication.medicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete medication');
      toast.success('Medication deleted successfully');
      onDelete(medication);
      onClose();
    } catch (err) {
      setSubmitError(err.message);
      toast.error(err.message || 'Failed to delete medication');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !medication) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in duration-200">
        <h2 className="text-2xl font-bold mb-6 text-red-600">Delete Medication</h2>
        <p className="text-gray-700 mb-4">Are you sure you want to delete <span className="font-bold">{medication?.name}</span> from your inventory?</p>
        {submitError && <p className="text-red-500 mb-2">{submitError}</p>}
        <div className="flex gap-2 mt-4">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none transition-all duration-150 font-semibold disabled:opacity-60"
            onClick={handleDelete}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</span> : 'Delete'}
          </button>
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all duration-150 font-semibold"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 