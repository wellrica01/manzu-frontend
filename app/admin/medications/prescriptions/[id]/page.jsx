"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft, CheckCircle, X, Plus } from "lucide-react";
import MedicationSearchField from "@/components/MedicationSearchField";

const statusOptions = ["PENDING", "VERIFIED", "REJECTED", "EXPIRED"];

const DOSAGE_FREQUENCY_OPTIONS = [
  { value: "ONCE_DAILY", label: "Once daily" },
  { value: "TWICE_DAILY", label: "Twice daily" },
  { value: "THREE_TIMES_DAILY", label: "Three times daily" },
  { value: "FOUR_TIMES_DAILY", label: "Four times daily" },
  { value: "EVERY_4_HOURS", label: "Every 4 hours" },
  { value: "EVERY_6_HOURS", label: "Every 6 hours" },
  { value: "EVERY_8_HOURS", label: "Every 8 hours" },
  { value: "EVERY_12_HOURS", label: "Every 12 hours" },
  { value: "AT_BEDTIME", label: "At bedtime" },
  { value: "AS_NEEDED", label: "As needed" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "CUSTOM", label: "Custom" },
];

const DOSAGE_TIMING_OPTIONS = [
  { value: "BEFORE_MEALS", label: "Before meals" },
  { value: "AFTER_MEALS", label: "After meals" },
  { value: "WITH_FOOD", label: "With food" },
  { value: "ON_EMPTY_STOMACH", label: "On empty stomach" },
  { value: "MORNING", label: "Morning" },
  { value: "EVENING", label: "Evening" },
  { value: "ANYTIME", label: "Anytime" },
];

const DURATION_TYPE_OPTIONS = [
  { value: "DAYS", label: "Days" },
  { value: "WEEKS", label: "Weeks" },
  { value: "MONTHS", label: "Months" },
  { value: "UNTIL_FINISHED", label: "Until finished" },
  { value: "ONGOING", label: "Ongoing" },
];

function StatusBadge({ status }) {
  let color = "bg-gray-200 text-gray-700";
  const normalized = status ? status.toUpperCase() : "";
  if (normalized === "VERIFIED") color = "bg-green-100 text-green-800";
  else if (normalized === "PENDING") color = "bg-yellow-100 text-yellow-800";
  else if (normalized === "REJECTED") color = "bg-red-100 text-red-800";
  else if (normalized === "EXPIRED") color = "bg-gray-400 text-white";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {normalized.charAt(0) + normalized.slice(1).toLowerCase()}
    </span>
  );
}

function formatDosageInstructions(med) {
  const parts = [];
  if (med.dosageAmount) parts.push(med.dosageAmount);
  if (med.dosageFrequency) {
    const freq = DOSAGE_FREQUENCY_OPTIONS.find(f => f.value === med.dosageFrequency);
    if (freq) parts.push(freq.label.toLowerCase());
  }
  if (med.dosageTiming) {
    const timing = DOSAGE_TIMING_OPTIONS.find(t => t.value === med.dosageTiming);
    if (timing) parts.push(timing.label.toLowerCase());
  }
  if (med.durationValue && med.durationType) {
    const durType = DURATION_TYPE_OPTIONS.find(d => d.value === med.durationType);
    if (durType) {
      parts.push(`for ${med.durationValue} ${durType.label.toLowerCase()}`);
    }
  }
  if (med.additionalNotes) parts.push(`(${med.additionalNotes})`);
  
  return parts.length > 0 ? parts.join(' ') : 'No instructions';
}

export default function PrescriptionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [medications, setMedications] = useState([]);
  const [addMedLoading, setAddMedLoading] = useState(false);
  const [addMedError, setAddMedError] = useState(null);
  const [addMedSuccess, setAddMedSuccess] = useState(false);
  const [medForm, setMedForm] = useState([{ 
    medicationId: '', 
    displayName: '', 
    quantity: 1, 
    dosageAmount: '',
    dosageFrequency: '',
    dosageTiming: '',
    durationValue: '',
    durationType: 'DAYS',
    additionalNotes: ''
  }]);

  useEffect(() => {
    async function fetchPrescription() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const res = await fetch(`${API_BASE}/api/admin/prescriptions/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        const prescriptionData = data.data?.prescription;

        setPrescription(prescriptionData || null);
        setMedications(prescriptionData?.PrescriptionMedication || []);
        setNewStatus(prescriptionData?.status || "");

      } catch (e) {
        setError("Failed to load prescription details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPrescription();
  }, [id]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setStatusLoading(true);
    setStatusError(null);
    setStatusSuccess(false);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
      const res = await fetch(`${API_BASE}/api/prescription/${id}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error: ${res.status}`);
      }
      setStatusSuccess(true);
      setTimeout(() => setStatusSuccess(false), 1200);
    } catch (e) {
      setStatusError(e.message);
    } finally {
      setStatusLoading(false);
    }
  }

  function handleMedFormChange(idx, field, value) {
    setMedForm((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function handleMedSelect(idx, med) {
    setMedForm((prev) => prev.map((item, i) => i === idx ? { ...item, medicationId: med.id, displayName: med.displayName } : item));
  }

  function addMedRow() {
    setMedForm((prev) => [...prev, { 
      medicationId: "", 
      displayName: "", 
      quantity: 1, 
      dosageAmount: '',
      dosageFrequency: '',
      dosageTiming: '',
      durationValue: '',
      durationType: 'DAYS',
      additionalNotes: ''
    }]);
  }

  function removeMedRow(idx) {
    setMedForm((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleAddMedications(e) {
    e.preventDefault();
    setAddMedLoading(true);
    setAddMedError(null);
    setAddMedSuccess(false);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
      
      const medicationsPayload = medForm.map(({ 
        medicationId, 
        quantity, 
        dosageAmount,
        dosageFrequency,
        dosageTiming,
        durationValue,
        durationType,
        additionalNotes
      }) => ({
        medicationId: Number(medicationId),
        quantity: Number(quantity),
        ...(dosageAmount ? { dosageAmount } : {}),
        ...(dosageFrequency ? { dosageFrequency } : {}),
        ...(dosageTiming ? { dosageTiming } : {}),
        ...(durationValue ? { durationValue: Number(durationValue) } : {}),
        ...(durationType ? { durationType } : {}),
        ...(additionalNotes ? { additionalNotes } : {}),
      }));

      const res = await fetch(`${API_BASE}/api/prescription/${id}/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ medications: medicationsPayload }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error: ${res.status}`);
      }
      
      setAddMedSuccess(true);
      setTimeout(() => {
        setAddMedSuccess(false);
        window.location.reload(); // Reload to show new medications
      }, 1200);
    } catch (e) {
      setAddMedError(e.message);
    } finally {
      setAddMedLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        className="flex items-center gap-2 text-[#225F91] hover:underline mb-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-8 h-8 text-[#1ABA7F]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 text-red-600">
          <AlertTriangle className="w-8 h-8" />
          <span>{error}</span>
        </div>
      ) : !prescription ? (
        <div className="text-center text-gray-500">Prescription not found.</div>
      ) : (
        <>
          {/* Prescription Details Card */}
          <Card className="p-4 md:p-6 bg-white border border-[#1ABA7F]/20 rounded-2xl shadow-md">
            <h2 className="text-lg md:text-xl font-bold text-[#225F91] mb-4">Prescription Details</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div><span className="font-semibold">User:</span> {prescription.userIdentifier}</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span> 
                <StatusBadge status={prescription.status} />
              </div>
              <div><span className="font-semibold">Created:</span> {new Date(prescription.createdAt).toLocaleString()}</div>
              {prescription.fileUrl && (
                <div className="mt-2">
                  <a href={prescription.fileUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-[#1ABA7F] underline break-all">
                    View Uploaded File
                  </a>
                </div>
              )}
            </div>

            {/* Status Update Form */}
            <form className="mt-6 space-y-3" onSubmit={handleStatusUpdate}>
              <label className="block text-sm font-medium text-[#225F91]">Update Status</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {statusLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Update Status"}
                </button>
              </div>
              {statusError && (
                <div className="text-red-600 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}
              {statusSuccess && (
                <div className="text-green-600 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Status updated!</span>
                </div>
              )}
            </form>
          </Card>

          {/* Add Medications Card */}
          <Card className="p-4 md:p-6 bg-white border border-[#1ABA7F]/20 rounded-2xl shadow-md">
            <h3 className="text-lg md:text-xl font-bold text-[#225F91] mb-4">Add Medications</h3>
            
            <form className="space-y-4" onSubmit={handleAddMedications}>
              {medForm.map((row, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-3 relative">
                  {medForm.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeMedRow(idx)} 
                      className="absolute top-2 right-2 text-red-600 hover:bg-red-50 rounded-full p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* Medication Search */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Medication *</label>
                    <MedicationSearchField
                      value={row.displayName ? { id: row.medicationId, displayName: row.displayName } : null}
                      onSelect={med => handleMedSelect(idx, med)}
                      placeholder="Search medication..."
                    />
                  </div>

                  {/* Quantity and Dosage Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={e => handleMedFormChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Dosage Amount</label>
                      <input
                        type="text"
                        placeholder="e.g., 1 tablet, 5ml"
                        value={row.dosageAmount}
                        onChange={e => handleMedFormChange(idx, 'dosageAmount', e.target.value)}
                        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Frequency and Timing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        value={row.dosageFrequency}
                        onChange={e => handleMedFormChange(idx, 'dosageFrequency', e.target.value)}
                        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                      >
                        <option value="">Select frequency</option>
                        {DOSAGE_FREQUENCY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Timing</label>
                      <select
                        value={row.dosageTiming}
                        onChange={e => handleMedFormChange(idx, 'dosageTiming', e.target.value)}
                        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                      >
                        <option value="">Select timing</option>
                        {DOSAGE_TIMING_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration Value</label>
                      <input
                        type="number"
                        min={1}
                        placeholder="e.g., 7"
                        value={row.durationValue}
                        onChange={e => handleMedFormChange(idx, 'durationValue', e.target.value)}
                        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration Type</label>
                      <select
                        value={row.durationType}
                        onChange={e => handleMedFormChange(idx, 'durationType', e.target.value)}
                        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                      >
                        {DURATION_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes</label>
                    <input
                      type="text"
                      placeholder="Special instructions..."
                      value={row.additionalNotes}
                      onChange={e => handleMedFormChange(idx, 'additionalNotes', e.target.value)}
                      className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
                    />
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  type="button" 
                  onClick={addMedRow} 
                  className="flex items-center justify-center gap-2 px-4 py-2 text-[#1ABA7F] border border-[#1ABA7F] rounded-lg hover:bg-[#1ABA7F]/5 transition text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Another Medication
                </button>
                <button
                  type="submit"
                  disabled={addMedLoading}
                  className="px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50 text-sm"
                >
                  {addMedLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Medications"}
                </button>
              </div>

              {addMedError && (
                <div className="text-red-600 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{addMedError}</span>
                </div>
              )}
              {addMedSuccess && (
                <div className="text-green-600 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Medications added successfully!</span>
                </div>
              )}
            </form>
          </Card>

          {/* Medications List Card */}
          <Card className="p-4 md:p-6 bg-white border border-[#1ABA7F]/20 rounded-2xl shadow-md">
            <h3 className="text-lg md:text-xl font-bold text-[#225F91] mb-4">Current Medications</h3>
            {medications.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-8">No medications added yet.</div>
            ) : (
              <div className="space-y-3">
                {medications.map((pm, idx) => (
                  <div key={idx} className="p-3 border border-gray-200 rounded-lg space-y-1 text-sm">
                    <div className="font-semibold text-[#225F91]">
                      {pm.Medication?.brandName || pm.Medication?.fullName || `Med ID: ${pm.medicationId}`}
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">Quantity:</span> {pm.quantity}
                    </div>
                    <div className="text-gray-700 italic">
                      {formatDosageInstructions(pm)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Related Orders Card */}
          {prescription.Order && prescription.Order.length > 0 && (
            <Card className="p-4 md:p-6 bg-white border border-[#1ABA7F]/20 rounded-2xl shadow-md">
              <h3 className="text-lg md:text-xl font-bold text-[#225F91] mb-4">Related Orders</h3>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full text-xs md:text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 hidden sm:table-cell">Pharmacy</th>
                      <th className="py-2 px-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.Order.map((order) => (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-medium text-gray-900">{order.id}</td>
                        <td className="py-2 px-3"><StatusBadge status={order.status} /></td>
                        <td className="py-2 px-3 hidden sm:table-cell">{order.Pharmacy?.name || "-"}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}