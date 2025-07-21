"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export default function MedicationForm({ medication = {}, mode = "create" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: medication.name || "",
    genericName: medication.genericName || "",
    category: medication.category || "",
    manufacturer: medication.manufacturer || "",
    form: medication.form || "",
    dosage: medication.dosage || "",
    nafdacCode: medication.nafdacCode || "",
    prescriptionRequired: medication.prescriptionRequired ?? false,
    imageUrl: medication.imageUrl || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
      const url =
        mode === "edit"
          ? `${API_BASE}/api/admin/medications/${medication.id}`
          : `${API_BASE}/api/admin/medications`;
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error: ${res.status}`);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/medications");
      }, 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Generic Name *</label>
          <input
            name="genericName"
            value={form.genericName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Category *</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Manufacturer *</label>
          <input
            name="manufacturer"
            value={form.manufacturer}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Form *</label>
          <input
            name="form"
            value={form.form}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Dosage *</label>
          <input
            name="dosage"
            value={form.dosage}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">NAFDAC Code</label>
          <input
            name="nafdacCode"
            value={form.nafdacCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Image URL</label>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            name="prescriptionRequired"
            checked={form.prescriptionRequired}
            onChange={handleChange}
            id="prescriptionRequired"
            className="h-4 w-4 border-gray-300 rounded"
          />
          <label htmlFor="prescriptionRequired" className="text-sm text-[#225F91]">Prescription Required</label>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-[#1ABA7F]">
          <Loader2 className="animate-spin w-5 h-5" />
          Saving...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      ) : success ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          Success!
        </div>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50"
      >
        {mode === "edit" ? "Update Medication" : "Create Medication"}
      </button>
    </form>
  );
} 