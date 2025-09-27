"use client";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { fetchPharmacologicalClasses } from "../pharmacological-classes/api"; // Adjust path

export default function ChemicalClassForm({ initialData = {}, onSubmit, loading = false, error = null }) {
  const [name, setName] = useState(initialData.name || "");
  const [atcCode, setAtcCode] = useState(initialData.atcCode || "");
  const [parentId, setParentId] = useState(initialData.parentId || "");
  const [pharmaClasses, setPharmaClasses] = useState([]);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch pharmacological classes for dropdown
  useEffect(() => {
    fetchPharmacologicalClasses()
      .then((res) => setPharmaClasses(res.pharmacologicalClasses || []))
      .catch(() => setPharmaClasses([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    if (!name.trim() || !atcCode.trim() || !parentId) {
      setFormError("All fields are required");
      return;
    }

    try {
      await onSubmit({ name, atcCode, parentId: parseInt(parentId, 10) });
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
          <label className="block text-sm font-medium text-[#225F91] mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">ATC Code *</label>
          <input
            type="text"
            value={atcCode}
            onChange={(e) => setAtcCode(e.target.value)}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
            maxLength={5}
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Pharmacological Class *</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading || pharmaClasses.length === 0}
            required
          >
            <option value="">Select a pharmacological class</option>
            {pharmaClasses.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback */}
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
          <CheckCircle className="w-5 h-5" /> Success!
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
