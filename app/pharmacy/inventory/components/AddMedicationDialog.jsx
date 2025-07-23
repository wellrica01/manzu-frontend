import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AddMedicationDialog({ open, onClose }) {
  const [form, setForm] = useState({ medicationId: '', stock: '', price: '', expiryDate: '', medicationName: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);
  let suggestionTimeout = null;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Suggestion fetcher
  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setSuggestionLoading(true);
    setSuggestionError(null);
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch('http://localhost:5000/api/medication-suggestions?q=' + encodeURIComponent(query), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      setSuggestionError(err.message);
      setSuggestions([]);
    } finally {
      setSuggestionLoading(false);
    }
  };

  // Handle medication input change
  const handleMedicationInput = e => {
    const value = e.target.value;
    setForm(f => ({ ...f, medicationName: value, medicationId: '' }));
    setShowSuggestions(true);
    if (suggestionTimeout) clearTimeout(suggestionTimeout);
    suggestionTimeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion select
  const handleSuggestionSelect = (med) => {
    setForm(f => ({ ...f, medicationName: med.displayName, medicationId: med.id }));
    setShowSuggestions(false);
    setSuggestions([]);
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
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Add medication form">
            <div>
              <label className="block mb-1 font-medium" htmlFor="add-medication-suggest">Medication</label>
              <input
                id="add-medication-suggest"
                name="medicationName"
                type="text"
                autoComplete="off"
                value={form.medicationName}
                onChange={handleMedicationInput}
                required
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                aria-required="true"
                onFocus={() => form.medicationName && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type to search medication..."
              />
              {suggestionLoading && <div className="text-xs text-gray-500 mt-1">Loading...</div>}
              {suggestionError && <div className="text-xs text-red-500 mt-1">{suggestionError}</div>}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 bg-white border rounded shadow mt-1 w-full max-h-48 overflow-y-auto">
                  {suggestions.map(med => (
                    <li
                      key={med.id}
                      className="px-3 py-2 hover:bg-primary/10 cursor-pointer text-sm"
                      onMouseDown={() => handleSuggestionSelect(med)}
                    >
                      {med.displayName}
                    </li>
                  ))}
                </ul>
              )}
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
      </div>
    </div>
  );
}