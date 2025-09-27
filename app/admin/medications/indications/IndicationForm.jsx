"use client";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { fetchGenericNames } from "../generic-names/api";

export default function IndicationForm({ initialData = {}, onSubmit, loading = false, error = null }) {
  const [form, setForm] = useState({
    genericId: initialData.genericId || "", // updated field name to match API
    indication: initialData.indication || "",
    translations: initialData.translations || "",
  });
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [genericOptions, setGenericOptions] = useState([]);

  useEffect(() => {
    fetchGenericNames({ limit: 100 })
      .then(res => setGenericOptions(res.genericNames || [])) // updated to match API
      .catch(err => console.error("Failed to fetch generic names", err));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    if (!form.genericId || isNaN(Number(form.genericId))) {
      setFormError("Generic Medication is required");
      return;
    }
    if (!form.indication.trim()) {
      setFormError("Indication is required");
      return;
    }

    try {
      await onSubmit({
        genericId: Number(form.genericId),
        indication: form.indication.trim(),
        translations: form.translations ? form.translations : undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch (err) {
      setFormError(err.message || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Generic Medication *</label>
          <select
            name="genericId"
            value={form.genericId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            required
            disabled={loading}
          >
            <option value="">Select...</option>
            {genericOptions.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Indication *</label>
          <input
            name="indication"
            value={form.indication}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            required
            disabled={loading}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Translations (JSON/text, optional)</label>
          <input
            name="translations"
            value={form.translations}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#1ABA7F]">
          <Loader2 className="animate-spin w-5 h-5" /> Saving...
        </div>
      ) : formError || error ? (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          {formError || error}
        </div>
      ) : success ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          Success!
        </div>
      ) : null}

      <button
        type="submit"
        className="px-6 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50"
        disabled={loading}
      >
        Save
      </button>
    </form>
  );
}
