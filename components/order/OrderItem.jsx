import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const OrderItem = ({
  item,
  providerName,
  providerAddress,
  handleQuantityChange,
  setRemoveItem,
  isUpdating,
  calculateItemPrice,
  setOpenOrderDialog,
  setLastAddedItemDetails,
  setIsEditMode,
  setOpenUploadModal,
  fetchOrders
}) => {
  const isDiagnostic = item?.service?.type === 'diagnostic' || item?.service?.type === 'diagnostic_package';
  const displayName = isDiagnostic ? item?.service?.name || 'Unknown Service' : item?.service?.displayName || 'Unknown Item';
  const timeSlot = item?.timeSlotStart
    ? format(new Date(item.timeSlotStart), 'MMM d, yyyy, h:mm a')
    : 'Not scheduled';
  const fulfillmentType = item?.fulfillmentMethod
    ? item.fulfillmentMethod === 'lab_visit' ? 'In-Person' : 'Home Collection'
    : 'Not specified';
  const fulfillmentMethod = item?.fulfillmentMethod
    ? item.fulfillmentMethod === 'pick_up' ? 'Pickup' : 'Home Delivery'
    : 'Not specified';

  const onQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    handleQuantityChange(item.id, newQuantity, displayName);
  };

  const prescriptionStatus = item?.service?.prescriptionRequired
    ? item.prescriptions?.length
      ? item.prescriptions[0].status
      : 'missing'
    : 'not_required';

  const getStatusDisplay = () => {
    if (!item?.service?.prescriptionRequired) {
      return (
        <span className="flex items-center text-[#1ABA7F]">
          <CheckCircle className="h-5 w-5 mr-2" /> No Prescription Needed
        </span>
      );
    }
    if (!item?.prescriptions?.length) {
      return (
        <span className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" /> Prescription Required
        </span>
      );
    }
    const prescription = item.prescriptions[0];
    if (prescription.status === 'verified') {
      return (
        <span className="flex items-center text-[#1ABA7F]">
          <CheckCircle className="h-5 w-5 mr-2" /> Verified
        </span>
      );
    }
    if (prescription.status === 'pending') {
      return (
        <span className="flex items-center text-[#225F91]">
          <Clock className="h-5 w-5 mr-2" /> Pending Verification
        </span>
      );
    }
    return (
      <span className="flex items-center text-red-600" title={prescription.rejectReason || 'Prescription rejected'}>
        <AlertCircle className="h-5 w-5 mr-2" /> Rejected
      </span>
    );
  };

  // Safeguard for price and item total
  const unitPrice = item?.price !== undefined ? item.price / 100 : 0;
  const itemTotal = calculateItemPrice(item) !== undefined && !isNaN(calculateItemPrice(item)) 
    ? calculateItemPrice(item) / 100 
    : 0;

  if (item?.price === undefined || item?.quantity === undefined) {
    console.warn(`Missing price or quantity for item ${item?.id} (${displayName})`);
  }

  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-lg shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <Accordion type="single" collapsible>
        <AccordionItem value={`item-${item.id}`} className="border-none">
          <AccordionTrigger className="px-6 py-4 text-left hover:bg-[#1ABA7F]/10" aria-label={`Toggle details for ${displayName}`}>
            <div className="flex justify-between items-center w-full">
              <div>
                <h3 className="text-xl font-semibold text-[#225F91]">{displayName}</h3>
                <p className="text-sm text-gray-600">{providerName}</p>
                <p className="text-sm text-gray-600">₦{itemTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4">
            <CardContent className="p-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-700 text-base font-medium">
                <p>
                  <strong className="text-gray-900">Category:</strong> {item?.service?.category || 'N/A'}
                </p>
                <p className="flex items-center">
                  <strong className="text-gray-900">Prescription:</strong> {getStatusDisplay()}
                </p>
                {!isDiagnostic && (
                  <p>
                    <strong className="text-gray-900">Unit Price:</strong> ₦{unitPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                <p>
                  <strong className="text-gray-900">Item Total:</strong> ₦{itemTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p>
                  <strong className="text-gray-900">Provider:</strong> {providerName}
                </p>
                <p>
                  <strong className="text-gray-900">Address:</strong> {providerAddress || 'N/A'}
                </p>
                {isDiagnostic ? (
                  <>
                    <p>
                      <strong className="text-gray-900">Time Slot:</strong> {timeSlot}
                    </p>
                    <p>
                      <strong className="text-gray-900">Fulfillment:</strong> {fulfillmentType}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong className="text-gray-900">Delivery Method:</strong> {fulfillmentMethod}
                    </p>
                    <div className="flex items-center gap-3">
                      <strong className="text-gray-900">Quantity:</strong>
                      <div className="flex items-center gap-2 border border-[#1ABA7F]/20 rounded-xl bg-white/95 p-2">
                        <Button
                          className="h-12 w-12 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
                          onClick={() => onQuantityChange(item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating[item.id]}
                          aria-label={`Decrease quantity for ${displayName}`}
                        >
                          {isUpdating[item.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : '-'}
                        </Button>
                        <Input
                          type="number"
                          value={item?.quantity || 1}
                          onChange={(e) => onQuantityChange(parseInt(e.target.value))}
                          className="w-20 h-12 text-center text-base font-medium rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
                          min="1"
                          disabled={isUpdating[item.id]}
                          aria-label={`Quantity for ${displayName}`}
                        />
                        <Button
                          className="h-12 w-12 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
                          onClick={() => onQuantityChange((item.quantity || 0) + 1)}
                          disabled={isUpdating[item.id]}
                          aria-label={`Increase quantity for ${displayName}`}
                        >
                          {isUpdating[item.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : '+'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="h-12 px-6 rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
                  onClick={() => setRemoveItem({ id: item.id, name: displayName })}
                  disabled={isUpdating[item.id]}
                  aria-label={`Remove ${displayName} from order`}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Remove
                </Button>
                <Button
                  className="h-12 px-6 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
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
                {item?.service?.prescriptionRequired && item?.prescriptions?.some(p => p.status === 'rejected') && (
                  <Button
                    className="h-12 px-6 rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
                    onClick={() => setOpenUploadModal({ type: item.service.type, itemId: item.id })}
                    disabled={isUpdating[item.id]}
                    aria-label={`Re-upload prescription for ${displayName}`}
                  >
                    Re-upload
                  </Button>
                )}
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default OrderItem;