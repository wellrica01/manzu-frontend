import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const OrderItem = ({
  item,
  providerName,
  handleQuantityChange,
  setRemoveItem,
  isUpdating,
  calculateItemPrice,
  setOpenOrderDialog,
  setLastAddedItemDetails,
  setIsEditMode,
  setOpenUploadModal,
  fetchOrder
}) => {
  const isDiagnostic = item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package';
  const displayName = isDiagnostic ? item.service.name : item.service.displayName;
  const timeSlot = item.timeSlotStart
    ? format(new Date(item.timeSlotStart), 'MMM d, yyyy, h:mm a')
    : 'Not scheduled';
  const fulfillmentType = item.fulfillmentMethod
    ? item.fulfillmentMethod === 'lab_visit' ? 'In-Person' : 'Home Collection'
    : 'Not specified';
  const fulfillmentMethod = item.fulfillmentMethod
    ? item.fulfillmentMethod === 'pick_up' ? 'Pickup' : 'Home Delivery'
    : 'Not specified';

  const onQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    handleQuantityChange(item.id, newQuantity, displayName);
  };

  const prescriptionStatus = item.service.prescriptionRequired
    ? item.prescriptions?.length
      ? item.prescriptions[0].status
      : 'missing'
    : 'not_required';

  const getStatusDisplay = () => {
    if (!item.service.prescriptionRequired) {
      return (
        <span className="flex items-center text-[#1ABA7F]">
          <CheckCircle className="h-4 w-4 mr-1" /> No Prescription Needed
        </span>
      );
    }
    if (!item.prescriptions?.length) {
      return (
        <span className="flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" /> Prescription Required
        </span>
      );
    }
    const prescription = item.prescriptions[0];
    if (prescription.status === 'verified') {
      return (
        <span className="flex items-center text-[#1ABA7F]">
          <CheckCircle className="h-4 w-4 mr-1" /> Verified
        </span>
      );
    }
    if (prescription.status === 'pending') {
      return (
        <span className="flex items-center text-[#225F91]">
          <Clock className="h-4 w-4 mr-1" /> Pending Verification
        </span>
      );
    }
    return (
      <span className="flex items-center text-red-600" title={prescription.rejectReason || 'Prescription rejected'}>
        <AlertCircle className="h-4 w-4 mr-1" /> Rejected
      </span>
    );
  };

  return (
    <div className="border-b border-[#1ABA7F]/20 py-4 last:border-b-0">
      <h3 className="text-lg font-semibold text-gray-900 truncate">{displayName}</h3>
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-2 text-gray-600 text-sm sm:text-base font-medium">
        <p>
          <strong>Category:</strong> {item.service.category}
        </p>
        <p className="flex items-center">
          <strong>Prescription:</strong> {getStatusDisplay()}
        </p>
        {!isDiagnostic && (
          <p>
            <strong>Unit Price:</strong> ₦{(item.price / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
        )}
        <p>
          <strong>Item Total:</strong> ₦{(calculateItemPrice(item) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        {isDiagnostic ? (
          <>
            <p>
              <strong>Time Slot:</strong> {timeSlot}
            </p>
            <p>
              <strong>Fulfillment:</strong> {fulfillmentType}
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>Delivery Method:</strong> {fulfillmentMethod}
            </p>
            <div className="flex items-center gap-2">
              <strong>Quantity:</strong>
              <Button
                className="h-10 w-10 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
                onClick={() => onQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1 || isUpdating[item.id]}
                aria-label={`Decrease quantity for ${displayName}`}
              >
                {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '-'}
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onQuantityChange(parseInt(e.target.value))}
                className="w-16 h-10 text-center text-base font-medium rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
                min="1"
                disabled={isUpdating[item.id]}
                aria-label={`Quantity for ${displayName}`}
              />
              <Button
                className="h-10 w-10 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
                onClick={() => onQuantityChange(item.quantity + 1)}
                disabled={isUpdating[item.id]}
                aria-label={`Increase quantity for ${displayName}`}
              >
                {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '+'}
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4">
        <Button
          className="h-10 px-4 rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
          onClick={() => setRemoveItem({ id: item.id, name: displayName })}
          disabled={isUpdating[item.id]}
          aria-label={`Remove ${displayName} from order`}
        >
          {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Remove
        </Button>
        <Button
          className="h-10 px-4 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
          onClick={() => {
            setIsEditMode(true);
            setOpenOrderDialog(true);
            setLastAddedItemDetails({
              itemId: item.id,
              providerId: item.providerId,
              serviceId: item.serviceId,
              serviceType: item.service.type,
            });
          }}
          disabled={isUpdating[item.id]}
          aria-label={`Edit ${isDiagnostic ? 'booking' : 'delivery method'} for ${displayName}`}
        >
          {isDiagnostic ? 'Edit Booking' : 'Edit Delivery Method'}
        </Button>
        {item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'rejected') && (
          <Button
            className="h-10 px-4 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
            onClick={() => setOpenUploadModal({ type: item.service.type, itemId: item.id })}
            disabled={isUpdating[item.id]}
            aria-label={`Re-upload prescription for ${displayName}`}
          >
            Re-upload
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderItem;