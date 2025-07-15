import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AddMedicationDialog({ open, onClose }) {
  const [availableMeds, setAvailableMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ medicationId: '', stock: '', price: '', expiryDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) return;
    async function fetchAvailable() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch('http://localhost:5000/api/pharmacy/medications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch medications');
        const data = await res.json();
        setAvailableMeds(data.availableMedications || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailable();
  }, [open]);

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
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicationId: form.medicationId,
          stock: form.stock,
          price: form.price,
          expiryDate: form.expiryDate,
        }),
      });
      if (!res.ok) throw new Error('Failed to add medication');
      toast.success('Medication added successfully');
      onClose();
    } catch (err) {
      setSubmitError(err.message);
      toast.error(err.message || 'Failed to add medication');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in duration-200">
        <h2 className="text-2xl font-bold mb-6 text-primary">Add Medication</h2>
        {loading ? (
          <div className="space-y-4">
            <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-red-500 mb-4">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Add medication form">
            <div>
              <label className="block mb-1 font-medium" htmlFor="add-medication-select">Medication</label>
              <select
                id="add-medication-select"
                name="medicationId"
                value={form.medicationId}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                aria-required="true"
              >
                <option value="">Select medication</option>
                {availableMeds.map(med => (
                  <option key={med.id} value={med.id}>{med.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="add-stock">Stock</label>
              <input
                id="add-stock"
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
              <label className="block mb-1 font-medium" htmlFor="add-price">Price (₦)</label>
              <input
                id="add-price"
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
              <label className="block mb-1 font-medium" htmlFor="add-expiry">Expiry Date</label>
              <input
                id="add-expiry"
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
                className="px-4 py-2 bg-[#1ABA7F] text-white rounded hover:bg-[#15996a] focus:ring-2 focus:ring-[#1ABA7F] focus:outline-none transition-all duration-150 font-semibold disabled:opacity-60"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Adding...</span> : 'Add Medication'}
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
        )}
      </div>
    </div>
  );
} 