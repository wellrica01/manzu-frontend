"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { fetchGenericMedications } from "../generic-medications/api";
import { fetchManufacturers } from "../manufacturers/api";

const DOSAGE_FORMS = [
  "TABLET", "CAPSULE", "CAPLET", "SYRUP", "INJECTION", "CREAM", "OINTMENT", "GEL", "SUSPENSION", "POWDER", "SUPPOSITORY", "EYE_DROP", "EAR_DROP", "DROPS", "NASAL_SPRAY", "INHALER", "PATCH", "LOZENGE", "EFFERVESCENT"
];
const STRENGTH_UNITS = [
  "MG", "ML", "G", "MCG", "IU", "NG", "MMOL", "PERCENT"
];
const ROUTES = [
  "ORAL", "INTRAVENOUS", "INTRAMUSCULAR", "SUBCUTANEOUS", "TOPICAL", "INHALATION", "RECTAL", "VAGINAL", "OPHTHALMIC", "OTIC", "NASAL", "SUBLINGUAL", "BUCCAL", "TRANSDERMAL"
];
const PACK_SIZE_UNITS = [
  "TABLETS", "CAPSULES", "ML", "VIALS", "AMPOULES", "SACHETS", "PATCHES", "BOTTLES", "TUBES", "BLISTERS"
];
const NAFDAC_STATUSES = ["VALID", "EXPIRED", "PENDING", "SUSPENDED"];
const REGULATORY_CLASSES = ["OTC", "PRESCRIPTION_ONLY", "SCHEDULE_I", "SCHEDULE_II", "SCHEDULE_III", "SCHEDULE_IV", "SCHEDULE_V", "RESTRICTED"];
const RESTRICTED_TO = ["GENERAL", "HOSPITAL_ONLY", "SPECIALTY_PHARMACY", "CONTROLLED_SUBSTANCE"];

export default function MedicationForm({ medication = {}, mode = "create", onSuccess }) {
  const router = useRouter();
  const [form, setForm] = useState({
    brandName: medication.brandName || "",
    genericMedicationId: medication.genericMedicationId || "",
    brandDescription: medication.brandDescription || "",
    localNames: medication.localNames ? medication.localNames.join(", ") : "",
    manufacturerId: medication.manufacturerId || "",
    form: medication.form || "",
    strengthValue: medication.strengthValue || "",
    strengthUnit: medication.strengthUnit || "",
    route: medication.route || "",
    packSizeQuantity: medication.packSizeQuantity || "",
    packSizeUnit: medication.packSizeUnit || "",
    isCombination: medication.isCombination || false,
    combinationDescription: medication.combinationDescription || "",
    nafdacCode: medication.nafdacCode || "",
    nafdacStatus: medication.nafdacStatus || "PENDING",
    prescriptionRequired: medication.prescriptionRequired ?? false,
    regulatoryClass: medication.regulatoryClass || "",
    restrictedTo: medication.restrictedTo || "",
    insuranceCoverage: medication.insuranceCoverage || false,
    approvalDate: medication.approvalDate ? medication.approvalDate.slice(0, 10) : "",
    expiryDate: medication.expiryDate ? medication.expiryDate.slice(0, 10) : "",
    storageConditions: medication.storageConditions || "",
    imageUrl: medication.imageUrl || "",
  });
  const [genericOptions, setGenericOptions] = useState([]);
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchGenericMedications({ limit: 100 }).then(res => {
      setGenericOptions(res.genericMedications || []);
    });
    fetchManufacturers({ limit: 100 }).then(res => {
      setManufacturerOptions(res.manufacturers || []);
    });
  }, []);

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
      // Prepare data for backend
      const payload = {
        ...form,
        localNames: form.localNames ? form.localNames.split(",").map(s => s.trim()).filter(Boolean) : [],
        strengthValue: form.strengthValue ? parseFloat(form.strengthValue) : null,
        packSizeQuantity: form.packSizeQuantity ? parseInt(form.packSizeQuantity) : null,
        approvalDate: form.approvalDate || undefined,
        expiryDate: form.expiryDate || undefined,
        genericMedicationId: form.genericMedicationId ? parseInt(form.genericMedicationId) : undefined,
        manufacturerId: form.manufacturerId ? parseInt(form.manufacturerId) : undefined,
      };
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
      if (onSuccess) onSuccess();
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
          <label className="block text-sm font-medium text-[#225F91] mb-1">Brand Name *</label>
          <input
            name="brandName"
            value={form.brandName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Generic Medication *</label>
          <select
            name="genericMedicationId"
            value={form.genericMedicationId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {genericOptions.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Brand Description</label>
          <input
            name="brandDescription"
            value={form.brandDescription}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Local Names (comma separated)</label>
          <input
            name="localNames"
            value={form.localNames}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Manufacturer</label>
          <select
            name="manufacturerId"
            value={form.manufacturerId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {manufacturerOptions.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Form</label>
          <select
            name="form"
            value={form.form}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {DOSAGE_FORMS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Strength Value</label>
          <input
            name="strengthValue"
            type="number"
            value={form.strengthValue}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Strength Unit</label>
          <select
            name="strengthUnit"
            value={form.strengthUnit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {STRENGTH_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Route</label>
          <select
            name="route"
            value={form.route}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {ROUTES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Pack Size Quantity</label>
          <input
            name="packSizeQuantity"
            type="number"
            value={form.packSizeQuantity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Pack Size Unit</label>
          <select
            name="packSizeUnit"
            value={form.packSizeUnit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {PACK_SIZE_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            name="isCombination"
            checked={form.isCombination}
            onChange={handleChange}
            id="isCombination"
            className="h-4 w-4 border-gray-300 rounded"
          />
          <label htmlFor="isCombination" className="text-sm text-[#225F91]">Is Combination</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Combination Description</label>
          <input
            name="combinationDescription"
            value={form.combinationDescription}
            onChange={handleChange}
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
          <label className="block text-sm font-medium text-[#225F91] mb-1">NAFDAC Status</label>
          <select
            name="nafdacStatus"
            value={form.nafdacStatus}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            {NAFDAC_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Regulatory Class</label>
          <select
            name="regulatoryClass"
            value={form.regulatoryClass}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {REGULATORY_CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Restricted To</label>
          <select
            name="restrictedTo"
            value={form.restrictedTo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          >
            <option value="">Select...</option>
            {RESTRICTED_TO.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            name="insuranceCoverage"
            checked={form.insuranceCoverage}
            onChange={handleChange}
            id="insuranceCoverage"
            className="h-4 w-4 border-gray-300 rounded"
          />
          <label htmlFor="insuranceCoverage" className="text-sm text-[#225F91]">Insurance Coverage</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Approval Date</label>
          <input
            name="approvalDate"
            type="date"
            value={form.approvalDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Expiry Date</label>
          <input
            name="expiryDate"
            type="date"
            value={form.expiryDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Storage Conditions</label>
          <input
            name="storageConditions"
            value={form.storageConditions}
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