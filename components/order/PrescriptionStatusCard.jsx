'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const PrescriptionStatusCard = ({ item, onReupload }) => {
  const { service, prescriptions } = item;
  const hasPrescription = prescriptions?.length > 0;
  const status = service.prescriptionRequired
    ? hasPrescription
      ? prescriptions[0].status
      : 'missing'
    : 'not_required';
  const rejectReason = hasPrescription ? prescriptions[0].rejectReason : null;

  const getStatusContent = () => {
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center gap-2 text-[#1ABA7F]">
            <CheckCircle className="h-5 w-5" />
            <span>Prescription Verified</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-[#225F91]">
            <Clock className="h-5 w-5" />
            <span>Prescription Pending Verification</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Prescription Rejected: {rejectReason || 'Please re-upload a valid prescription'}</span>
            </div>
            <Button
              className="h-8 px-4 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
              onClick={() => onReupload(item.id, service.type)}
              aria-label={`Re-upload prescription for ${service.displayName || service.name}`}
            >
              Re-upload Prescription
            </Button>
          </div>
        );
      case 'missing':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Prescription Required</span>
            </div>
            <Button
              className="h-8 px-4 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
              onClick={() => onReupload(item.id, service.type)}
              aria-label={`Upload prescription for ${service.displayName || service.name}`}
            >
              Upload Prescription
            </Button>
          </div>
        );
      case 'not_required':
        return (
          <div className="flex items-center gap-2 text-[#1ABA7F]">
            <CheckCircle className="h-5 w-5" />
            <span>No Prescription Required</span>
          </div>
        );
      default:
        return <span className="text-gray-600">Unknown Status</span>;
    }
  };

  return (
    <div className="bg-white/95 p-4 rounded-xl border-[#1ABA7F]/20 shadow-sm">
      <h3 className="text-lg font-semibold text-[#225F91] mb-2">
        {service.displayName || service.name}
      </h3>
      <p className="text-gray-600">Price: ₦{(item.price * item.quantity / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
      <p className="text-gray-600">Quantity: {item.quantity}</p>
      {getStatusContent()}
    </div>
  );
};

export default PrescriptionStatusCard;