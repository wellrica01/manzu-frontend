"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import MedicationSearchField from "@/components/MedicationSearchField";
const statusOptions = ["PENDING", "VERIFIED", "REJECTED", "EXPIRED"];

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
  const [medForm, setMedForm] = useState([{ medicationId: '', displayName: '', quantity: 1, dosageInstructions: '' }]);

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
        setPrescription(data.prescription);
        setMedications(data.prescription.prescriptionMedications || []);
        setNewStatus(data.prescription.status);
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
    setMedForm((prev) => [...prev, { medicationId: "", displayName: "", quantity: 1, dosageInstructions: "" }]);
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
      // Only send allowed fields to backend
      const medicationsPayload = medForm.map(({ medicationId, quantity, dosageInstructions }) => ({
        medicationId: Number(medicationId),
        quantity: Number(quantity),
        ...(dosageInstructions ? { dosageInstructions } : {})
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
      setTimeout(() => setAddMedSuccess(false), 1200);
    } catch (e) {
      setAddMedError(e.message);
    } finally {
      setAddMedLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
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
          <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
            <h2 className="text-xl font-bold text-[#225F91] mb-4">Prescription Details</h2>
            <div className="space-y-2">
              <div><span className="font-semibold">User Identifier:</span> {prescription.userIdentifier}</div>
              <div><span className="font-semibold">Status:</span> <StatusBadge status={prescription.status} /></div>
              <div><span className="font-semibold">Verified:</span> {prescription.verified ? "Yes" : "No"}</div>
              <div><span className="font-semibold">Created At:</span> {new Date(prescription.createdAt).toLocaleString()}</div>
              {prescription.fileUrl && (
                <div className="mt-2">
                  <a href={prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#1ABA7F] underline">View Uploaded File</a>
                </div>
              )}
            </div>
            {/* Status Update Form */}
            <form className="mt-6 space-y-2" onSubmit={handleStatusUpdate}>
              <label className="block text-sm font-medium text-[#225F91] mb-1">Update Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={statusLoading}
                className="ml-2 px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50"
              >
                {statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Status"}
              </button>
              {statusError && <div className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{statusError}</div>}
              {statusSuccess && <div className="text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Status updated!</div>}
            </form>
            {/* Add Medications Form */}
            <form className="mt-8 space-y-2" onSubmit={handleAddMedications}>
              <label className="block text-sm font-medium text-[#225F91] mb-1">Add Medications</label>
              {medForm.map((row, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <div className="flex-1">
                    <MedicationSearchField
                      value={row.displayName ? { id: row.medicationId, displayName: row.displayName } : null}
                      onSelect={med => handleMedSelect(idx, med)}
                      placeholder="Search medication..."
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    placeholder="Quantity"
                    value={row.quantity}
                    onChange={e => handleMedFormChange(idx, 'quantity', e.target.value)}
                    className="w-24 px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dosage instructions (optional)"
                    value={row.dosageInstructions}
                    onChange={e => handleMedFormChange(idx, 'dosageInstructions', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
                  />
                  {medForm.length > 1 && (
                    <button type="button" onClick={() => removeMedRow(idx)} className="text-red-600 font-bold">&times;</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMedRow} className="text-[#1ABA7F] underline">+ Add another</button>
              <button
                type="submit"
                disabled={addMedLoading}
                className="ml-2 px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50"
              >
                {addMedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Medications"}
              </button>
              {addMedError && <div className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{addMedError}</div>}
              {addMedSuccess && <div className="text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Medications added!</div>}
            </form>
            {/* List Medications */}
            <div className="mt-8">
              <h3 className="font-semibold text-[#225F91] mb-2">Medications</h3>
              {medications.length === 0 ? (
                <div className="text-gray-500">No medications added yet.</div>
              ) : (
                <ul className="space-y-1">
                  {medications.map((pm, idx) => (
                    <li key={idx} className="border-b last:border-0 py-2">
                      <span className="font-medium">ID:</span> {pm.medicationId} |
                      <span className="font-medium"> Name:</span> {pm.medication?.brandName || pm.medicationId} |
                      <span className="font-medium"> Quantity:</span> {pm.quantity}
                      {pm.dosageInstructions && (
                        <span> | <span className="font-medium">Dosage:</span> {pm.dosageInstructions}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Related Orders */}
            {prescription.orders && prescription.orders.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-[#225F91] mb-2">Related Orders</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-2 px-3">Order ID</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Pharmacy</th>
                        <th className="py-2 px-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.orders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium text-gray-900">{order.id}</td>
                          <td className="py-2 px-3"><StatusBadge status={order.status} /></td>
                          <td className="py-2 px-3">{order.pharmacy?.name || "-"}</td>
                          <td className="py-2 px-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
} 