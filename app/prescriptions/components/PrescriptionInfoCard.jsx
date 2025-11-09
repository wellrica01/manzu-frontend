import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { FileText, Eye, ChevronDown, ChevronUp, Calendar, Pill, X, Badge } from 'lucide-react';

const PrescriptionInfoCard = ({ prescriptionMetadata, medications }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!prescriptionMetadata) return null;

  return (
    <Card className="relative border-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-gray-50 to-white shadow-lg sm:shadow-xl overflow-hidden mb-10 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon with glow */}
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-30 animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
                <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-md sm:shadow-lg">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" strokeWidth={2} />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black text-[#225F91] mb-1 sm:mb-2">
                  {prescriptionMetadata.status === 'VERIFIED'
                    ? 'Prescription Summary'
                    : 'Under Review'}
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base font-semibold">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" strokeWidth={2} />
                  {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {prescriptionMetadata.fileUrl && (
              <Button
                onClick={() => setShowPreview(true)}
                className="relative h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold border-2 overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95 shadow-md sm:shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#225F91] to-cyan-600" />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }}
                />
                <span className="relative z-10 flex items-center gap-2 text-white text-sm sm:text-base">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                  View Prescription
                </span>
              </Button>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Medications Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" strokeWidth={2.5} />
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-[#225F91]">Prescribed Medications</h4>
              <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 shadow-lg">
                {medications?.length || 0}
              </Badge>
            </div>

            {medications?.length === 0 ? (
              <div className="p-8 sm:p-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 text-center">
                <Pill className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" strokeWidth={1.5} />
                <p className="text-gray-600 font-semibold text-sm sm:text-base">
                  No medications found
                </p>
              </div>
            ) : (
              <>
                <ul
                  className={cn(
                    'space-y-3',
                    !isExpanded && medications.length > 5 && 'max-h-[500px] sm:max-h-[600px] overflow-hidden relative'
                  )}
                >
                  {medications.map((med, index) => (
                    <li
                      key={med.id}
                      className="group relative p-4 sm:p-5 border-2 border-gray-200 hover:border-emerald-300 rounded-2xl bg-white transition-all duration-300 hover:shadow-md sm:hover:shadow-lg animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        {med.imageUrl ? (
                          <div className="relative shrink-0">
                            <img
                              src={med.imageUrl}
                              alt={med.displayName}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-emerald-300 transition-colors duration-300"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Pill className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" strokeWidth={2} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 mb-1 sm:mb-2 text-base sm:text-lg group-hover:text-emerald-600 transition-colors duration-300 truncate">
                            {med.displayName}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <Badge className="bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                              {med.quantity} {med.form || 'unit'}
                              {med.quantity > 1 ? 's' : ''}
                            </Badge>
                            {med.packSizeExpression && (
                              <span className="text-xs sm:text-sm text-gray-600 font-semibold">
                                {med.packSizeExpression} {med.packSizeUnit}
                              </span>
                            )}
                          </div>
                          {med.dosageInstructions && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                              <span className="font-bold text-gray-700">Dosage:</span>{' '}
                              {med.dosageInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {!isExpanded && medications.length > 5 && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}

                {medications.length > 5 && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full text-[#225F91] hover:bg-emerald-50 font-bold h-12 sm:h-14 rounded-xl sm:rounded-2xl mt-3 sm:mt-4 border-2 border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
                  >
                    {isExpanded ? (
                      <>
                        Show Less
                        <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 ml-2" strokeWidth={2.5} />
                      </>
                    ) : (
                      <>
                        Show All {medications.length} Medications
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 ml-2" strokeWidth={2.5} />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[90vw] sm:max-w-4xl p-0 rounded-2xl sm:rounded-3xl overflow-hidden border-0 shadow-2xl">
          <VisuallyHidden>
            <DialogTitle>Prescription Image</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <Button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-300 hover:scale-110 active:scale-95"
              size="icon"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
            </Button>
            <img
              src={prescriptionMetadata?.fileUrl}
              alt="Prescription"
              className="w-full h-auto object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </Card>
  );
};

export default PrescriptionInfoCard;
