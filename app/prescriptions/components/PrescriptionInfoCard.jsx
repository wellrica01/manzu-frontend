"use client";
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { FileText, Eye, ChevronDown, ChevronUp, Calendar, Pill } from 'lucide-react';
import Link from 'next/link';

const PrescriptionInfoCard = ({ prescriptionMetadata, medications }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const availableMeds = medications.filter(med => med.availability?.length > 0).length;

  if (!prescriptionMetadata) return null;

  const renderMedicationList = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1ABA7F]/15 to-[#225F91]/15">
          <Pill className="h-4 w-4 text-[#225F91]" strokeWidth={2.5} />
        </div>
        <h4 className="text-base sm:text-xl font-black text-[#225F91]">
          Prescribed Medications ({medications.length}) 
        </h4>
      </div>

      {medications.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200 text-center">
          <p className="text-gray-600 font-semibold">No medications found.</p>
        </div>
      ) : (
        <>
          <ul
            className={cn(
              "space-y-3",
              !isExpanded && medications.length > 5 && "max-h-32 overflow-hidden relative"
            )}
          >
            {medications.map((med, index) => (
              <li 
                key={med.id} 
                className="group relative border-2 border-gray-100 hover:border-[#1ABA7F]/30 rounded-xl px-2 sm:px-3 py-2 transition-all duration-300 hover:shadow-lg bg-white"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  {med.imageUrl ? (
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                      <img
                        src={med.imageUrl}
                        alt={med.displayName}
                        className="relative w-16 h-16 object-cover rounded-xl border-2 border-gray-200 group-hover:border-[#1ABA7F]/50 transition-all duration-300 shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200">
                      <Pill className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  {/* Med info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-sm sm:text-lg mb-2 group-hover:text-[#225F91] transition-colors duration-300">
                      {med.displayName}
                    </p>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 text-xs sm:text-sm font-bold text-[#225F91]">
                          Qty: {med.quantity} {med.packSizeUnit}
                        </span>
                      </div>

                      {med.dosageInstructions && (
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">
                          <span className="font-bold text-gray-700">Dosage:</span> {med.dosageInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl" />
              </li>
            ))}

            {!isExpanded && medications.length > 5 && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </ul>

          {medications.length > 5 && (
            <Button
              variant="link"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-[#225F91] hover:text-[#1ABA7F] font-black text-base mt-4 flex items-center justify-center gap-2 group"
            >
              {isExpanded ? (
                <>
                  Show Less
                  <ChevronUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform duration-300" />
                </>
              ) : (
                <>
                  Show All {medications.length} Medications
                  <ChevronDown className="h-5 w-5 group-hover:translate-y-1 transition-transform duration-300" />
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );

  return (
    <Card className="relative shadow-2xl border-2 border-[#1ABA7F]/30 rounded-3xl bg-white/98 backdrop-blur-xl px-4 py-8 sm:px-8 mb-8 overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/15 to-transparent rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#225F91]/15 to-transparent rounded-tl-full" />
      

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1ABA7F] to-[#225F91] shadow-xl">
              <FileText className="h-4 sm:h-6 w-4 sm:w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg sm:text-3xl font-black text-[#225F91]">
                {prescriptionMetadata.status === 'VERIFIED' ? 'Prescription Summary' : 'Prescription Under Review'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600 font-semibold">
                  Uploaded on {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString('en-US', {
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
              className="group h-12 sm:h-12 px-3 sm:px-6 rounded-2xl border-2 border-[#225F91] text-[#225F91] bg-white hover:bg-[#225F91] hover:text-white font-black transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
              View Prescription
            </Button>
          )}
        </div>

        {/* Decorative line */}
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F] shadow-lg animate-gradient bg-300%" />

        {/* Medications List */}
        {renderMedicationList()}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-3xl p-0 rounded-3xl bg-white/98 border-2 border-[#1ABA7F]/30 overflow-hidden shadow-2xl">
          <DialogTitle>
            <VisuallyHidden>Prescription Image Preview</VisuallyHidden>
          </DialogTitle>
          <div className="relative">
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={() => setShowPreview(false)}
                className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-[#225F91] shadow-xl border-2 border-gray-200 hover:border-[#1ABA7F] transition-all duration-300"
                size="icon"
              >
                ×
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

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .bg-300\% {
          background-size: 300% 300%;
        }
        .delay-75 {
          animation-delay: 75ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </Card>
  );
};

export default PrescriptionInfoCard;