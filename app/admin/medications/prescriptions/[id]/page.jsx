"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, CheckCircle, X, Trash, Plus, Pill, Loader2, AlertTriangle, 
  ClipboardList, ZoomIn, ZoomOut, Eye, EyeOff, FileText, Calendar,
  User, Package
} from "lucide-react";
import MedicationDialog from "./MedicationDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog"

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

export default function PrescriptionTranslator() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id;
  
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageVisible, setImageVisible] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
  open: false,
  mode: null, // 'single' | 'bulk'
  medicationId: null,
});
  
  const [medications, setMedications] = useState([
    { 
      id: Date.now(),
      medicationId: '', 
      displayName: '', 
      quantity: 1, 
      dosageAmount: '',
      dosageFrequency: 'TWICE_DAILY',
      durationValue: '7',
      durationType: 'DAYS',
      showAdvanced: false,
    }
  ]);

  useEffect(() => {
    async function fetchPrescription() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const res = await fetch(`${API_BASE}/api/admin/prescriptions/${prescriptionId}`, {
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
      } catch (e) {
        setError("Failed to load prescription");
      } finally {
        setLoading(false);
      }
    }
    if (prescriptionId) fetchPrescription();
  }, [prescriptionId]);

  const addMedication = () => {
    setMedications([...medications, {
      id: Date.now(),
      medicationId: '', 
      displayName: '', 
      quantity: 1, 
      dosageAmount: '',
      dosageFrequency: 'TWICE_DAILY',
      durationValue: '7',
      durationType: 'DAYS',
      showAdvanced: false,
    }]);
  };

  const removeMedication = (id) => {
    if (medications.length > 1) {
      setMedications(medications.filter(m => m.id !== id));
    }
  };

  const updateMedication = (id, fieldOrUpdates, value) => {
    setMedications(medications.map(m => {
      if (m.id !== id) return m;
      if (typeof fieldOrUpdates === 'object') {
        return { ...m, ...fieldOrUpdates };
      }
      return { ...m, [fieldOrUpdates]: value };
    }));
  };

  const handleQuickVerify = async (newStatus) => {
    setSaving(true);
    setSaveError(null);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
      const res = await fetch(`${API_BASE}/api/prescription/${prescriptionId}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setPrescription(prev => ({ ...prev, status: newStatus }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMedications = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
      
      const medicationsPayload = medications
        .filter(m => m.medicationId)
        .map(({ 
          medicationId, 
          quantity, 
          dosageAmount,
          dosageFrequency,
          durationValue,
          durationType,
        }) => ({
          medicationId: Number(medicationId),
          quantity: Number(quantity),
          ...(dosageAmount ? { dosageAmount } : {}),
          ...(dosageFrequency ? { dosageFrequency } : {}),
          ...(durationValue ? { durationValue: Number(durationValue) } : {}),
          ...(durationType ? { durationType } : {}),
        }));

      if (medicationsPayload.length === 0) {
        throw new Error("Please add at least one medication");
      }

      const res = await fetch(`${API_BASE}/api/prescription/${prescriptionId}/medications`, {
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
        throw new Error(data.message || "Failed to save medications");
      }
      
      setSaveSuccess(true);
      setDialogOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };


const handleDeleteSingle = (medicationId) => {
  setConfirmDialog({
    open: true,
    mode: "single",
    medicationId,
  });
};


const handleBulkDelete = () => {
  if (selectedMedications.length === 0) {
    setSaveError("No medications selected");
    return;
  }
  setConfirmDialog({
    open: true,
    mode: "bulk",
    medicationId: null,
  });
};


const handleConfirmDelete = async () => {
  setDeleting(true);
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

    if (confirmDialog.mode === "single") {
      const res = await fetch(`${API_BASE}/api/prescription/remove/${prescriptionId}/medications/${confirmDialog.medicationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete medication");

      setPrescription((prev) => ({
        ...prev,
        PrescriptionMedication: prev.PrescriptionMedication.filter(
          (pm) => pm.id !== confirmDialog.medicationId
        ),
      }));
    } else if (confirmDialog.mode === "bulk") {
      const res = await fetch(`${API_BASE}/api/prescription/remove/${prescriptionId}/medications`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ prescriptionMedicationIds: selectedMedications }),
      });

      if (!res.ok) throw new Error("Failed to delete selected medications");
      const data = await res.json();

      setPrescription((prev) => ({
        ...prev,
        PrescriptionMedication: prev.PrescriptionMedication.filter(
          (pm) => !selectedMedications.includes(pm.id)
        ),
      }));
      setSelectedMedications([]);
      setSaveSuccess(true);
    }
  } catch (err) {
    setSaveError(err.message);
  } finally {
    setDeleting(false);
    setConfirmDialog({ open: false, mode: null, medicationId: null });
  }
};



  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-linear-to-br from-[#225F91]/5 to-[#1ABA7F]/5">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-[#1ABA7F] mx-auto mb-4" />
          <p className="text-gray-600">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-red-600 px-4">
        <div className="bg-red-50 rounded-full p-6">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <span className="text-lg font-medium">{error}</span>
      </div>
    );
  }

  const hasMedications = prescription?.PrescriptionMedication && prescription.PrescriptionMedication.length > 0;
  const hasOrders = prescription?.Order && prescription.Order.length > 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <button 
              className="flex items-center gap-2 text-[#225F91] hover:text-[#1A4971] font-medium transition-colors text-sm sm:text-base"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> 
              <span className="hidden sm:inline">Back</span>
            </button>
                    
        <div className="flex items-center gap-2">
          {/* When pending or expired, show both */}
          {(!prescription?.status || 
            prescription?.status === "PENDING" || 
            prescription?.status === "EXPIRED") && (
            <>
              <button
                onClick={() => handleQuickVerify("VERIFIED")}
                disabled={saving}
                className="px-3 sm:px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                    <span>Verify</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleQuickVerify("REJECTED")}
                disabled={saving}
                className="px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                    <span>Reject</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* When verified, only show Reject */}
          {prescription?.status === "VERIFIED" && (
            <button
              onClick={() => handleQuickVerify("REJECTED")}
              disabled={saving}
              className="px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span>Reject</span>
                </>
              )}
            </button>
          )}

          {/* When rejected, only show Verify */}
          {prescription?.status === "REJECTED" && (
            <button
              onClick={() => handleQuickVerify("VERIFIED")}
              disabled={saving}
              className="px-3 sm:px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span>Verify</span>
                </>
              )}
            </button>
          )}
        </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Status Messages */}
        {saveSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Changes saved successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">{saveError}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Prescription Image Panel */}
          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
            <Card className="overflow-hidden h-full flex flex-col">
              {/* Image Header */}
              <div className="p-3 sm:p-4 bg-linear-to-r from-[#225F91] to-[#1A4971] flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    prescription?.status === "VERIFIED" ? "bg-green-400 animate-pulse" : 
                    prescription?.status === "REJECTED" ? "bg-red-400" : "bg-yellow-400 animate-pulse"
                  }`}></div>
                  <span className="font-semibold text-white text-sm sm:text-base">
                    Prescription Image
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button 
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-medium text-white min-w-10 sm:min-w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <div className="w-px h-5 sm:h-6 bg-white/30 mx-1"></div>
                  <button 
                    onClick={() => setImageVisible(!imageVisible)}
                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors lg:hidden text-white"
                  >
                    {imageVisible ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Image Container */}
              {imageVisible && (
                <div className="flex-1 overflow-auto bg-gray-50 p-3 sm:p-6">
                  {prescription?.fileUrl ? (
                    <img 
                      src={prescription.fileUrl} 
                      alt="Prescription" 
                      className="w-full h-auto rounded-lg shadow-lg mx-auto"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                        <p className="font-medium text-sm sm:text-base">No prescription image</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Info & Actions Panel */}
          <div className="space-y-4">
            {/* Quick Info Card */}
            <Card className="p-4 sm:p-5 bg-linear-to-br from-white to-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    Prescription ID: {prescription?.id || "Prescription"}
                  </h2>
                  <StatusBadge status={prescription?.status} />
                </div>
                <button
                  onClick={() => setDetailsExpanded(!detailsExpanded)}
                  className="text-[#225F91] hover:bg-[#225F91]/10 p-2 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>

              {detailsExpanded && (
                <div className="space-y-3 pt-3 border-t border-gray-200 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>User ID: {prescription?.userIdentifier || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {prescription?.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>Medications: {hasMedications ? prescription.PrescriptionMedication.length : 0}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Add Medications Button */}
            <button
              onClick={() => setDialogOpen(true)}
              className="w-full py-4 px-4 rounded-xl bg-linear-to-r from-[#1ABA7F] to-[#15a372] text-white font-bold hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              Add Medications
            </button>

            {/* Current Medications */}
            {hasMedications && (
              <Card className="p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-bold text-[#225F91] mb-3 sm:mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Current Medications ({prescription.PrescriptionMedication.length})
                </h3>

                <div className="space-y-2 sm:space-y-3">
              {prescription.PrescriptionMedication.map((pm) => {
                const isSelected = selectedMedications.includes(pm.id);
                return (
                  <div
                    key={pm.id}
                    className={`p-3 sm:p-4 border border-gray-200 rounded-lg flex items-start justify-between hover:bg-gray-50 transition ${isSelected ? "bg-red-50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox for bulk select */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedMedications([...selectedMedications, pm.id]);
                          else
                            setSelectedMedications(selectedMedications.filter(id => id !== pm.id));
                        }}
                        className="mt-1 accent-[#1ABA7F]"
                      />
                      <div>
                        <div className="font-semibold text-[#225F91] text-sm sm:text-base mb-1">
                          {pm.Medication?.fullName || pm.Medication?.brandName || `Medication ID: ${pm.medicationId}`}
                        </div>
                        <div className="text-gray-600 text-xs sm:text-sm">
                          <span className="font-medium">Qty:</span> {pm.quantity}
                        </div>
                        <div className="text-gray-700 text-xs sm:text-sm italic mt-1">
                          {pm.dosageInstructions
                            ? pm.dosageInstructions
                            : [
                                pm.dosageAmount ? `${pm.dosageAmount}` : "",
                                pm.dosageFrequency ? pm.dosageFrequency.replace("_", " ").toLowerCase() : "",
                                pm.dosageTiming ? pm.dosageTiming.replace("_", " ").toLowerCase() : "",
                                pm.durationValue ? `for ${pm.durationValue} ${pm.durationType?.toLowerCase()}` : "",
                              ]
                                .filter(Boolean)
                                .join(" ") || "No dosage details"}
                        </div>
                      </div>
                    </div>

                    {/* Trash Icon for single delete */}
                    <button
                      onClick={() => handleDeleteSingle(pm.id)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-800 transition-colors ml-2"
                      title="Delete medication"
                    >
                      <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                );
              })}

              {selectedMedications.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : `Delete Selected (${selectedMedications.length})`}
                  </button>
                </div>
              )}

                </div>
              </Card>
            )}

            {/* Related Orders */}
            {hasOrders && (
              <Card className="p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-bold text-[#225F91] mb-3 sm:mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Related Orders ({prescription.Order.length})
                </h3>

                <div className="space-y-2 sm:space-y-3">
                  {prescription.Order.map((order) => (
                    <div key={order.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">Order #{order.id}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      
                      {order.Pharmacy?.name && (
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">
                          <span className="font-medium">Pharmacy:</span> {order.Pharmacy.name}
                        </div>
                      )}
                      
                      {order.totalPrice && (
                        <div className="text-sm sm:text-base font-bold text-[#225F91]">
                          ₦{order.totalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Medication Dialog */}
      <MedicationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        medications={medications}
        onUpdate={updateMedication}
        onRemove={removeMedication}
        onAdd={addMedication}
        onSave={handleSaveMedications}
        saving={saving}
        prescriptionImage={prescription?.fileUrl}
      />

      <DeleteConfirmationDialog
        open={confirmDialog.open}
        onCancel={() => setConfirmDialog({ open: false, mode: null, medicationId: null })}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={
          confirmDialog.mode === "bulk"
            ? "Delete Selected Medications"
            : "Delete Medication"
        }
        description={
          confirmDialog.mode === "bulk"
            ? `Are you sure you want to delete ${selectedMedications.length} selected medications? This action cannot be undone.`
            : "Are you sure you want to delete this medication? This action cannot be undone."
        }
      />

    </div>
  );
}