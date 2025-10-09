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

  return (
    <Card className="border-2 border-gray-100 rounded-2xl bg-white p-6 mb-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1ABA7F] to-[#225F91]">
              <FileText className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#225F91]">
                {prescriptionMetadata.status === 'VERIFIED' ? 'Prescription Summary' : 'Under Review'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500" strokeWidth={2} />
                <p className="text-sm text-gray-600">
                  {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString('en-US', {
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
            className="h-11 px-5 rounded-lg border-2 border-[#225F91] bg-white text-[#225F91] hover:bg-[#225F91] hover:text-white font-bold transition-colors duration-200 shrink-0 mt-3 sm:mt-0"
          >
            <Eye className="h-4 w-4 mr-2" strokeWidth={2} />
            View
          </Button>

          )}
        </div>

        <div className="h-px bg-gray-200" />

        {/* Medications List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-[#225F91]" strokeWidth={2} />
            <h4 className="text-lg font-bold text-[#225F91]">
              Prescribed Medications
            </h4>
          </div>

          {medications?.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-600">No medications found</p>
            </div>
          ) : (
            <>
              <ul className={cn(
                "space-y-2",
                !isExpanded && medications.length > 5 && "max-h-96 overflow-hidden"
              )}>
                {medications.map((med) => (
                  <li 
                    key={med.id} 
                    className="border border-gray-200 hover:border-[#1ABA7F]/40 rounded-xl p-3 bg-white transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {med.imageUrl ? (
                        <img
                          src={med.imageUrl}
                          alt={med.displayName}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Pill className="h-6 w-6 text-gray-400" strokeWidth={2} />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-1">
                          {med.displayName}
                        </p>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="px-2 py-1 rounded-md bg-[#1ABA7F]/10 font-bold text-[#225F91]">
                            {med.quantity} {getUnitLabel(med.form)}{med.quantity > 1 ? 's' : ''}
                          </span>
                          <span className="text-gray-600">
                            {med.packSizeExpression} {med.packSizeUnit}
                          </span>
                        </div>
                        {med.dosageInstructions && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-bold">Dosage:</span> {med.dosageInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {medications.length > 5 && (
                <Button
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-[#225F91] hover:bg-[#1ABA7F]/5 font-bold h-10 rounded-lg"
                >
                  {isExpanded ? (
                    <>Show Less <ChevronUp className="h-4 w-4 ml-2" strokeWidth={2} /></>
                  ) : (
                    <>Show All {medications.length} <ChevronDown className="h-4 w-4 ml-2" strokeWidth={2} /></>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl p-0 rounded-2xl">
          <VisuallyHidden>
            <DialogTitle>Prescription Image</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <Button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white shadow-lg"
              size="icon"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </Button>
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