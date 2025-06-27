import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const OrderItem = ({ item, handleQuantityChange, setRemoveItem, isUpdating, calculateItemPrice, setOpenOrderDialog, setLastAddedItemDetails }) => {
  const isDiagnostic = item.service.type === 'diagnostic';
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

  return (
    <div className="border-b border-[#1ABA7F]/20 py-4 last:border-b-0">
      <h3 className="text-lg font-semibold text-gray-900 truncate">{displayName}</h3>
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-2 text-gray-600 text-sm sm:text-base font-medium">
        <p>
          <strong>Category:</strong> {item.service.category}
        </p>
        <p>
          <strong>Prescription:</strong> {item.service.prescriptionRequired ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Type:</strong> {item.service.type}
        </p>
        <p>
          <strong>Unit Price:</strong> ₦{item.price.toLocaleString()}
        </p>
        <p>
          <strong>Item Total:</strong> ₦{calculateItemPrice(item).toLocaleString()}
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
          <p>
            <strong>Delivery Method:</strong> {fulfillmentMethod}
          </p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4">
        <div className="flex items-center gap-2">
          <Button
            className="h-10 w-10 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
            onClick={() => handleQuantityChange(item.id, item.quantity - 1, displayName)}
            disabled={item.quantity <= 1 || isUpdating[item.id]}
            aria-label={`Decrease quantity for ${displayName}`}
          >
            {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '-'}
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, displayName)}
            className="w-16 h-10 text-center text-base font-medium rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
            min="1"
            disabled={isUpdating[item.id]}
            aria-label={`Quantity for ${displayName}`}
          />
          <Button
            className="h-10 w-10 rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_10px_rgba(34,95,145,0.3)] transition-all duration-300"
            onClick={() => handleQuantityChange(item.id, item.quantity + 1, displayName)}
            disabled={isUpdating[item.id]}
            aria-label={`Increase quantity for ${displayName}`}
          >
            {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '+'}
          </Button>
        </div>
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
            setOpenOrderDialog(true);
            setLastAddedItemDetails({
              itemId: item.id,
              providerId: item.providerId,
              serviceId: item.serviceId,
            });
          }}
          disabled={isUpdating[item.id]}
          aria-label={`Edit ${isDiagnostic ? 'booking' : 'delivery method'} for ${displayName}`}
        >
          {isDiagnostic ? 'Edit Booking' : 'Edit Delivery Method'}
        </Button>
      </div>
    </div>
  );
};

export default OrderItem;