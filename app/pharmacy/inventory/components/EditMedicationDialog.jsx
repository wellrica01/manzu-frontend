import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditMedicationDialog({ open, onClose, medication }) {
  const [form, setForm] = useState({ stock: '', price: '', expiryDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open && medication) {
      setForm({
        stock: medication.stock || '',
        price: medication.price || '',
        expiryDate: medication.expiryDate ? medication.expiryDate.slice(0, 10) : '',
      });
    }
  }, [open, medication]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch('http://localhost:5000/api/pharmacy/medications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicationId: medication.medicationId,
          stock: form.stock,
          price: form.price,
          expiryDate: form.expiryDate,
        }),
      });
      if (!res.ok) throw new Error('Failed to update medication');
      toast.success('Medication updated successfully');
      onClose();
    } catch (err) {
      setSubmitError(err.message);
      toast.error(err.message || 'Failed to update medication');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !medication) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in duration-200">
        <h2 className="text-2xl font-bold mb-6 text-primary">Edit Medication</h2>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Edit medication form">
          <div>
            <label className="block mb-1 font-medium" htmlFor="edit-medication-name">Medication</label>
            <input
              id="edit-medication-name"
              type="text"
              value={medication.name}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="edit-stock">Stock</label>
            <input
              id="edit-stock"
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              required
              min="0"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              aria-required="true"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="edit-price">Price ( 6)</label>
            <input
              id="edit-price"
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              aria-required="true"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="edit-expiry">Expiry Date</label>
            <input
              id="edit-expiry"
              type="date"
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          {submitError && <p className="text-red-500">{submitError}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-150 font-semibold disabled:opacity-60"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span> : 'Save Changes'}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all duration-150 font-semibold"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 