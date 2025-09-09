import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const PrescriptionInfoCard = ({ prescriptionMetadata, medications }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const availableMeds = medications.filter(med => med.availability?.length > 0).length;

  if (!prescriptionMetadata) return null;

  const renderMedicationList = () => (
    <div>
      <h4 className="text-base sm:text-lg font-semibold text-[#225F91] mb-3">Prescribed Medications</h4>
      {medications.length === 0 ? (
        <p className="text-gray-600 text-sm">No medications found.</p>
      ) : (
        <>
<ul
  className={cn(
    "space-y-2",
    !isExpanded && medications.length > 5 && "max-h-24 overflow-hidden"
  )}
>
  {medications.map((med) => (
    <li key={med.id} className="border-b border-gray-200 pb-2">
      <div className="flex items-start gap-3">
        {/* Left side: Thumbnail */}
        {med.imageUrl && (
          <img
            src={med.imageUrl}
            alt={med.fullName}
            className="w-12 h-12 object-cover rounded-md border border-gray-200"
          />
        )}

        {/* Right side: Med name, qty, and details stacked */}
        <div className="flex-1">
            <p className="text-gray-800 text-sm sm:text-base font-medium">
              {med.fullName}
            </p>
         <p className="text-xs text-gray-600">
              Qty: {med.quantity} {med.packSizeUnit}
            </p>

          {med.dosageInstructions && (
              <p className='text-xs text-gray-600'>Dosage: {med.dosageInstructions}</p>
          )}
        </div>
      </div>
    </li>
  ))}
</ul>

    {medications.length > 5 && (
    <Button
        variant="link"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[#225F91] mt-2"
    >
        {isExpanded ? 'Show Less' : 'Show All Medications'}
    </Button>
    )}
    </>
    )}
    </div>
  );

  return (
    <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-6 sm:px-6 mb-6">
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
      <div className="flex justify-between items-center">
        <h3 className="text-xl sm:text-2xl font-bold text-[#225F91]">
          {prescriptionMetadata.status === 'VERIFIED' ? 'Prescription Summary' : 'Prescription Under Review'}
        </h3>
        {prescriptionMetadata.fileUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="border-[#1ABA7F] text-[#225F91]"
          >
            View Prescription
          </Button>
        )}
      </div>
      <p className="text-sm text-gray-600">
        Uploaded on {new Date(prescriptionMetadata.uploadedAt).toLocaleDateString()}
      </p>
      {renderMedicationList()}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white/95 border border-[#1ABA7F]/20">
          <DialogTitle>
            <VisuallyHidden>Prescription Image Preview</VisuallyHidden>
          </DialogTitle>
          <img
            src={prescriptionMetadata?.fileUrl}
            alt="Prescription"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PrescriptionInfoCard;