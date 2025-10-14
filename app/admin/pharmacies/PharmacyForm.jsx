"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle, Plus, Trash2 } from "lucide-react";

const statusOptions = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED", "CLOSED"];
const pharmacyTypeOptions = ["COMMUNITY", "HOSPITAL", "SPECIALTY", "PMV"];
const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function PharmacyForm({ pharmacy = {}, mode = "create" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: pharmacy.name || "",
    address: pharmacy.address || "",
    lga: pharmacy.lga || "",
    state: pharmacy.state || "",
    phone: pharmacy.phone || "",
    licenseNumber: pharmacy.licenseNumber || "",
    status: pharmacy.status || "PENDING",
    logoUrl: pharmacy.logoUrl || "",
    isActive: pharmacy.isActive ?? true,
    pharmacyType: pharmacy.pharmacyType || "COMMUNITY",
    ward: pharmacy.ward || "",
    operatingHours: pharmacy.operatingHours || [],
    deliveryAvailability: pharmacy.deliveryAvailability ?? false,
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

  function addOperatingHour() {
    setForm((prev) => ({
      ...prev,
      operatingHours: [
        ...prev.operatingHours,
        { dayOfWeek: "MONDAY", openTime: "09:00", closeTime: "17:00" }
      ]
    }));
  }

  function removeOperatingHour(index) {
    setForm((prev) => ({
      ...prev,
      operatingHours: prev.operatingHours.filter((_, i) => i !== index)
    }));
  }

  function updateOperatingHour(index, field, value) {
    setForm((prev) => ({
      ...prev,
      operatingHours: prev.operatingHours.map((hour, i) =>
        i === index ? { ...hour, [field]: value } : hour
      )
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Prepare payload according to backend schema
      const payload = {
        name: form.name,
        address: form.address,
        lga: form.lga,
        state: form.state,
        phone: form.phone,
        licenseNumber: form.licenseNumber,
        status: form.status,
        logoUrl: form.logoUrl || undefined, // Convert empty string to undefined
        isActive: form.isActive,
        pharmacyType: form.pharmacyType || undefined,
        ward: form.ward || undefined,
        operatingHours: form.operatingHours.length > 0 ? form.operatingHours : undefined,
        deliveryAvailability: form.deliveryAvailability || undefined,
      };

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
      const url =
        mode === "edit"
          ? `${API_BASE}/api/admin/pharmacies/${pharmacy.id}`
          : `${API_BASE}/api/admin/pharmacies`;
      const method = mode === "edit" ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error: ${res.status}`);
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/pharmacies");
      }, 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
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
          <label className="block text-sm font-medium text-[#225F91] mb-1">Address *</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">LGA *</label>
          <input
            name="lga"
            value={form.lga}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">State *</label>
          <input
            name="state"
            value={form.state}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Phone *</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="+2348012345678"
            pattern="^\+?\d{10,15}$"
            title="Phone must be 10-15 digits, optionally starting with +"
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">License Number *</label>
          <input
            name="licenseNumber"
            value={form.licenseNumber}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Status *</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Logo URL</label>
          <input
            name="logoUrl"
            value={form.logoUrl}
            onChange={handleChange}
            type="url"
            placeholder="https://example.com/logo.png"
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Pharmacy Type</label>
          <select
            name="pharmacyType"
            value={form.pharmacyType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            {pharmacyTypeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Ward</label>
          <input
            name="ward"
            value={form.ward}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            name="deliveryAvailability"
            checked={form.deliveryAvailability}
            onChange={handleChange}
            id="deliveryAvailability"
            className="h-4 w-4 border-gray-300 rounded"
          />
          <label htmlFor="deliveryAvailability" className="text-sm text-[#225F91]">Delivery Available</label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            id="isActive"
            className="h-4 w-4 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="text-sm text-[#225F91]">Active</label>
        </div>
      </div>

      {/* Operating Hours Section */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-[#225F91]">Operating Hours</label>
          <button
            type="button"
            onClick={addOperatingHour}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-[#1ABA7F] text-white rounded-lg hover:bg-[#159968]"
          >
            <Plus className="w-4 h-4" />
            Add Hours
          </button>
        </div>
        
        {form.operatingHours.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No operating hours set</p>
        ) : (
          <div className="space-y-3">
            {form.operatingHours.map((hour, index) => (
              <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                <select
                  value={hour.dayOfWeek}
                  onChange={(e) => updateOperatingHour(index, "dayOfWeek", e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={hour.openTime}
                  onChange={(e) => updateOperatingHour(index, "openTime", e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  required
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={hour.closeTime}
                  onChange={(e) => updateOperatingHour(index, "closeTime", e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeOperatingHour(index)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Messages */}
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50"
      >
        {mode === "edit" ? "Update Pharmacy" : "Create Pharmacy"}
      </button>
    </form>
  );
}