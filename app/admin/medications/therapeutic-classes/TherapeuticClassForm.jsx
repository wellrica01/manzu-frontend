"use client";
import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export default function TherapeuticClassForm({ initialData = {}, anatomicalClasses = [], onSubmit, loading = false, error = null }) {
  const [name, setName] = useState(initialData.name || "");
  const [atcCode, setAtcCode] = useState(initialData.atcCode || "");
  const [parentId, setParentId] = useState(initialData.parentId || "");
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    if (!name.trim() || !atcCode.trim() || !parentId) {
      setFormError("Name, ATC Code, and Anatomical Class are required");
      return;
    }

    try {
      await onSubmit({ name: name.trim(), atcCode: atcCode.trim(), parentId: Number(parentId) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch (err) {
      setFormError(err.message || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#225F91] mb-1">ATC Code *</label>
        <input
          type="text"
          value={atcCode}
          onChange={(e) => setAtcCode(e.target.value)}
          className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          disabled={loading}
          required
        />
      </div>

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
        <label className="block text-sm font-medium text-[#225F91] mb-1">Anatomical Class *</label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          disabled={loading}
          required
        >
          <option value="">Select Anatomical Class</option>
          {anatomicalClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.atcCode})
            </option>
          ))}
        </select>
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
