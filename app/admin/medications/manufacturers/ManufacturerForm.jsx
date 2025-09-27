"use client";
import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export default function ManufacturerForm({ initialData = {}, onSubmit, loading = false, error = null }) {
  const [form, setForm] = useState({
    name: initialData.name || "",
    country: initialData.country || "",
    contactInfo: initialData.contactInfo || "",
  });
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    try {
      await onSubmit(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch (err) {
      setFormError(err.message || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Country</label>
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Contact Info</label>
          <input
            name="contactInfo"
            value={form.contactInfo}
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