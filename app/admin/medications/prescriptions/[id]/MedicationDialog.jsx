import { X, ChevronDown, ChevronUp, Pill, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useState } from "react";
import MedicationSearchField from "@/components/MedicationSearchField";

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

const DURATION_TYPE_OPTIONS = [
  { value: "DAYS", label: "Days" },
  { value: "WEEKS", label: "Weeks" },
  { value: "MONTHS", label: "Months" },
  { value: "UNTIL_FINISHED", label: "Until finished" },
  { value: "ONGOING", label: "Ongoing" },
];

export default function MedicationDialog({ 
  isOpen, 
  onClose, 
  medications, 
  onUpdate, 
  onRemove, 
  onAdd,
  onSave,
  saving,
  prescriptionImage 
}) {
  const [zoom, setZoom] = useState(1);
  const [imageExpanded, setImageExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:flex items-center justify-start sm:justify-center overflow-y-auto sm:overflow-hidden p-0 sm:p-4">


      {/* Backdrop */}
    <div 
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
    onClick={onClose}
    />

      
      {/* Dialog */}
      <div className="relative z-10 bg-white w-full min-h-screen sm:min-h-0 sm:h-auto sm:max-w-6xl sm:max-h-[95vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-y-auto sm:overflow-hidden">


        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-linear-to-r from-[#225F91] to-[#1A4971] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Add Medications
              </h2>
              <p className="text-xs text-white/80 hidden sm:block">Review prescription and add medications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

{/* Content - Responsive Layout */}
<div className="flex-1 overflow-y-auto flex flex-col sm:flex-row">
  {/* On Mobile: Image appears above form */}
  <div className="w-full sm:w-2/5 border-b sm:border-b-0 sm:border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300">
    {/* Image Controls */}
    <div className="p-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between shrink-0">
      <span className="text-sm font-semibold text-gray-700">Prescription</span>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-gray-600 min-w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button 
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1 hidden sm:block"></div>
        <button 
          onClick={() => setImageExpanded(!imageExpanded)}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 hidden sm:block"
          title={imageExpanded ? "Show form" : "Expand image"}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Image Container */}
    <div className="flex-1 overflow-auto p-4">
      {prescriptionImage ? (
        <img 
          src={prescriptionImage} 
          alt="Prescription" 
          className="w-full h-auto rounded-lg shadow-lg"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No image available</p>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Medication Form */}
  <div className="flex-1 flex flex-col overflow-visible sm:overflow-hidden">
    <div className="flex-1 overflow-y-visible sm:overflow-y-auto p-4 sm:p-6 space-y-4">
      {medications.map((med, idx) => (
        <MedicationCard
          key={med.id}
          med={med}
          idx={idx}
          isOnlyOne={medications.length === 1}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
    </div>

    {/* Footer - Sticky */}
    <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 space-y-3 shrink-0">
      <button 
        onClick={onAdd}
        className="w-full py-3 px-4 text-[#1ABA7F] bg-white border-2 border-[#1ABA7F] rounded-xl hover:bg-[#1ABA7F]/5 transition-all font-semibold text-sm sm:text-base"
      >
        + Add Another Medication
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#225F91] to-[#1A4971] text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 text-sm sm:text-base"
      >
        {saving ? "Saving..." : "Save All Medications"}
      </button>
    </div>
  </div>
</div>

      </div>
    </div>
  );
}

function MedicationCard({ med, idx, isOnlyOne, onUpdate, onRemove }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1ABA7F] to-[#15a372] flex items-center justify-center text-white font-bold text-sm">
            {idx + 1}
          </div>
          <span className="font-bold text-gray-900">Medication {idx + 1}</span>
        </div>
        {!isOnlyOne && (
          <button 
            onClick={() => onRemove(med.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Medication Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Medication Name <span className="text-red-500">*</span>
        </label>
        <MedicationSearchField
          value={med.displayName ? { id: med.medicationId, displayName: med.displayName } : null}
          onSelect={selectedMed => {
            onUpdate(med.id, {
              medicationId: selectedMed.id,
              displayName: selectedMed.displayName || selectedMed.brandName
            });
          }}
          placeholder="Search medication..."
        />
      </div>

      {/* Quantity & Dosage */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={med.quantity}
            onChange={e => onUpdate(med.id, 'quantity', e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Dosage
          </label>
          <input
            type="text"
            placeholder="e.g., 1 tablet"
            value={med.dosageAmount}
            onChange={e => onUpdate(med.id, 'dosageAmount', e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        type="button"
        onClick={() => onUpdate(med.id, 'showAdvanced', !med.showAdvanced)}
        className="flex items-center gap-2 text-sm font-medium text-[#225F91] hover:text-[#1A4971] transition-colors"
      >
        {med.showAdvanced ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show details
          </>
        )}
      </button>

      {/* Advanced Fields */}
      {med.showAdvanced && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={med.dosageFrequency}
              onChange={e => onUpdate(med.id, 'dosageFrequency', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm bg-white"
            >
              {DOSAGE_FREQUENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration
              </label>
              <input
                type="number"
                min={1}
                placeholder="7"
                value={med.durationValue}
                onChange={e => onUpdate(med.id, 'durationValue', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Period
              </label>
              <select
                value={med.durationType}
                onChange={e => onUpdate(med.id, 'durationType', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#1ABA7F] focus:outline-none text-sm bg-white"
              >
                {DURATION_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}