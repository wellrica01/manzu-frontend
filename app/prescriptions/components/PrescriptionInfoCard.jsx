import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { getUnitLabel } from '@/lib/medicationUtils';
import { FileText, Eye, ChevronDown, ChevronUp, Calendar, Pill, X } from 'lucide-react';

const PrescriptionInfoCard = ({ prescriptionMetadata, medications }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  if (!prescriptionMetadata) return null;

  const renderMedicationList = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-[#1ABA7F]/15 to-[#225F91]/15">
          <Pill className="h-4 w-4 text-[#225F91]" strokeWidth={2.5} />
        </div>
        <h4 className="text-base sm:text-lg font-black text-[#225F91]">
          Prescribed Medications ({medications.length})
        </h4>
      </div>

      {medications.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <p className="text-gray-600 font-semibold">No medications found.</p>
        </div>
      ) : (
        <>
          <ul
            className={cn(
              "space-y-2",
              !isExpanded && medications.length > 5 && "max-h-96 overflow-hidden relative"
            )}
          >
            {medications.map((med, index) => (
              <li 
                key={med.id} 
                className="group relative border border-gray-200 hover:border-[#1ABA7F]/40 rounded-xl p-3 transition-all duration-300 hover:shadow-md bg-white"
              >
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  {med.imageUrl ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={med.imageUrl}
                        alt={med.displayName}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 group-hover:border-[#1ABA7F]/40 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                      <Pill className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />
                    </div>
                  )}

                  {/* Med info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-sm sm:text-base mb-1.5 group-hover:text-[#225F91] transition-colors">
                      {med.displayName}
                    </p>

                    <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 font-bold text-[#225F91]">
                        {med.quantity} {getUnitLabel(med.form)}{med.quantity > 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-600 font-semibold">
                        {med.packSizeExpression} {med.packSizeUnit} {med.quantity > 1 ? 'each' : ''}
                      </span>
                    </div>
                      {med.dosageInstructions && (
                        <p className="text-xs text-gray-600 font-medium mt-1">
                          <span className="font-bold text-gray-700">Dosage:</span> {med.dosageInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}

            {!isExpanded && medications.length > 5 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </ul>

          {medications.length > 5 && (
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-[#225F91] hover:text-[#1ABA7F] hover:bg-[#1ABA7F]/5 font-bold text-sm h-10 rounded-lg flex items-center justify-center gap-2 group"
            >
              {isExpanded ? (
                <>
                  Show Less
                  <ChevronUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
                </>
              ) : (
                <>
                  Show All {medications.length} Medications
                  <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" strokeWidth={2.5} />
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );

  return (
    <Card className="relative shadow-lg border-2 border-[#1ABA7F]/30 rounded-2xl bg-white p-4 sm:p-6 mb-6 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-tl-full" />
      
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-[#1ABA7F] to-[#225F91] shadow-lg">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-black text-[#225F91]">
                {prescriptionMetadata.status === 'VERIFIED' ? 'Prescription Summary' : 'Prescription Under Review'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                  Uploaded {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {prescriptionMetadata.fileUrl && (
            <Button
              onClick={() => setShowPreview(true)}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl border-2 border-[#225F91] text-[#225F91] bg-white hover:bg-[#225F91] hover:text-white font-bold text-sm transition-all duration-300 hover:scale-105 shadow-md group"
            >
              <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
              View Prescription
            </Button>
          )}
        </div>

        {/* Decorative line */}
        <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F]" />

        {/* Medications List */}
        {renderMedicationList()}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] mx-auto p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-[#1ABA7F]/30">
          <VisuallyHidden>
            <DialogTitle>Prescription Image Preview</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <div className="absolute top-3 right-3 z-10">
              <Button
                onClick={() => setShowPreview(false)}
                className="h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-[#225F91] shadow-lg border border-gray-200 hover:border-[#1ABA7F] transition-all"
                size="icon"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </Button>
            </div>
            <img
              src={prescriptionMetadata?.fileUrl}
              alt="Prescription"
              className="w-full h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PrescriptionInfoCard;