import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrder } from '@/hooks/useOrder';
import Link from 'next/link';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const OrderDialog = ({
  openOrderDialog,
  setOpenOrderDialog,
  lastAddedItem,
  serviceType,
  lastAddedItemDetails,
}) => {
  const router = useRouter();
  const isMedication = serviceType === 'medication';
  const dialogTitle = isMedication ? 'Added to Cart!' : 'Added to Booking!';
  const actionText = isMedication ? 'Cart' : 'Booking';
  const continueText = isMedication ? 'Continue Shopping' : 'Continue Searching';

  const { fetchTimeSlots, updateOrderDetails, order } = useOrder();

  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('in_person');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const lastItemRef = useRef(null);

  const fetchAndSetTimeSlots = async (params) => {
    setIsLoadingSlots(true);
    setErrorMessage('');
    try {
      console.log('Fetching time slots with params:', params);
      const data = await fetchTimeSlots.mutateAsync(params);
      console.log('fetchTimeSlots response:', data);
      setTimeSlots(data.timeSlots || []);
      if (data.timeSlots?.length) {
        setSelectedTimeSlot(data.timeSlots[0].start);
      } else {
        setErrorMessage('No available time slots for this date. Try another date or fulfillment type.');
      }
    } catch (err) {
      console.error('fetchTimeSlots error:', err.message, err.stack);
      setErrorMessage(err.message || 'Failed to load time slots. Please try again.');
      setTimeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    const lastItem = order.items?.[order.items.length - 1];
    const targetItem = lastAddedItemDetails || lastItem;

    if (
      !isMedication &&
      openOrderDialog &&
      targetItem?.providerId &&
      targetItem?.serviceId &&
      (lastItemRef.current?.itemId !== targetItem.itemId || !lastItemRef.current)
    ) {
      lastItemRef.current = targetItem;
      fetchAndSetTimeSlots({
        providerId: targetItem.providerId,
        serviceId: targetItem.serviceId,
        fulfillmentType,
        date: format(selectedDate, 'yyyy-MM-dd'),
      });
    }
  }, [openOrderDialog, isMedication, fulfillmentType, selectedDate, lastAddedItemDetails, order]);

  const formattedTimeSlots = useMemo(() => {
    return timeSlots.map((slot) => ({
      value: slot.start,
      label: new Date(slot.start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      availabilityStatus: slot.availabilityStatus,
    }));
  }, [timeSlots]);

  const handleSave = async () => {
    if (isMedication && !fulfillmentType) {
      toast.error('Please select a delivery method');
      return;
    }
    if (!isMedication && (!selectedTimeSlot || !fulfillmentType)) {
      toast.error('Please select a date, time slot, and fulfillment type');
      return;
    }

    const targetItem = lastAddedItemDetails;

    if (!targetItem?.itemId) {
      toast.error('No valid item found');
      return;
    }

    try {
      const updates = isMedication
        ? { itemId: targetItem.itemId, fulfillmentType }
        : {
            itemId: targetItem.itemId,
            timeSlotStart: selectedTimeSlot,
            fulfillmentType: fulfillmentType === 'in_person' ? 'lab_visit' : 'home_delivery',
          };
      await updateOrderDetails(updates);
      setOpenOrderDialog(false);
      toast.success(isMedication ? 'Delivery method saved!' : 'Booking saved successfully!');
      router.push('/order');
    } catch (error) {
      console.error('Failed to save details:', error);
      toast.error('Failed to save details');
    }
  };

  return (
    <Dialog open={openOrderDialog} onOpenChange={setOpenOrderDialog}>
      <DialogContent
        className="sm:max-w-md p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top-10 fade-in-20 duration Bél

System: -300">
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
        <DialogHeader className="flex flex-col items-center gap-3">
          <CheckCircle className="h-12 w-12 text-[#1ABA7F] animate-[pulse_1s_ease-in-out_infinite]" />
          <DialogTitle className="text-2xl font-bold text-[#225F91] tracking-tight text-center">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <p id="dialog-description" className="text-center text-gray-600 text-base font-medium mt-2">
          <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your {actionText.toLowerCase()}.
        </p>

        {isMedication ? (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="delivery-method" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Delivery Method
              </label>
              <Select
                id="delivery-method"
                value={fulfillmentType}
                onValueChange={(value) => {
                  setFulfillmentType(value);
                }}
              >
                <SelectTrigger className="mt-2 h-12 text-base rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)]">
                  <SelectValue placeholder="Choose delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pick_up">Pickup</SelectItem>
                  <SelectItem value="home_delivery">Home Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Date Picker */}
            <div>
              <label htmlFor="date-picker" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Select Date
              </label>
              <DatePicker
                id="date-picker"
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                className="mt-2 h-12 w-full rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
              />
            </div>

            {/* Time Slots */}
            <div>
              <label htmlFor="time-slot" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Select Time Slot
              </label>
              {isLoadingSlots ? (
                <Skeleton className="h-12 w-full rounded-xl mt-2" />
              ) : errorMessage ? (
                <p className="text-red-600 text-sm mt-1" role="alert">
                  {errorMessage}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {formattedTimeSlots.length ? (
                    formattedTimeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => setSelectedTimeSlot(slot.value)}
                        className={`p-2 rounded-lg border text-sm ${
                          selectedTimeSlot === slot.value
                            ? 'bg-[#1ABA7F] text-white border-[#1ABA7F]'
                            : 'bg-white border-[#1ABA7F]/20 hover:bg-[#1ABA7F]/10'
                        } ${slot.availabilityStatus === 'limited' ? 'opacity-75' : ''}`}
                        disabled={slot.availabilityStatus === 'booked'}
                      >
                        {slot.label}
                        {slot.availabilityStatus === 'limited' && (
                          <span className="ml-1 text-xs"> (Limited)</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm mt-1">No available time slots. Try another date.</p>
                  )}
                </div>
              )}
            </div>

            {/* Fulfillment Type */}
            <div>
              <label htmlFor="fulfillment-type" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Fulfillment Type
              </label>
              <Select
                id="fulfillment-type"
                value={fulfillmentType}
                onValueChange={(value) => {
                  setFulfillmentType(value);
                  setSelectedTimeSlot('');
                }}
              >
                <SelectTrigger className="mt-2 h-12 text-base rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)]">
                  <SelectValue placeholder="Choose fulfillment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab_visit">In-Person</SelectItem>
                  <SelectItem value="home_collection">Home Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setOpenOrderDialog(false)}
            className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
          >
            {continueText}
          </Button>

          <Button
            onClick={handleSave}
            className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300"
            disabled={isMedication ? !fulfillmentType : (!selectedTimeSlot || !fulfillmentType || isLoadingSlots)}
          >
            {isMedication ? 'Save Delivery Method' : 'Save Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;