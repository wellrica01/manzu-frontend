import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrder } from '@/hooks/useOrder';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Skeleton } from '@/components/ui/skeleton';
import { format, set } from 'date-fns';

const OrderDialog = ({
  openOrderDialog,
  setOpenOrderDialog,
  lastAddedItem,
  serviceType,
  lastAddedItemDetails,
  isEditMode = false,
  fetchOrders,
}) => {
  const router = useRouter();
  const isMedication = serviceType === 'medication';
  const dialogTitle = isEditMode
    ? isMedication
      ? 'Edit Delivery Method'
      : 'Edit Booking'
    : isMedication
      ? 'Added to Cart!'
      : 'Added to Booking!';
  const actionText = isMedication ? 'Cart' : 'Booking';
  const continueText = isMedication ? 'Continue Shopping' : 'Continue Searching';
  const saveButtonText = isEditMode
    ? isMedication
      ? 'Update Delivery Method'
      : 'Update Booking'
    : isMedication
      ? 'Save Delivery Method'
      : 'Save Booking';

  const { fetchTimeSlots, updateOrderDetails, orders } = useOrder();

  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState(isMedication ? 'pick_up' : 'lab_visit');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const lastItemRef = useRef(null);

  useEffect(() => {
    if (isEditMode && lastAddedItemDetails?.itemId && Array.isArray(orders)) {
      const orderItem = orders
        .flatMap((order) => order.items)
        .find((item) => item.id === lastAddedItemDetails.itemId);
      if (orderItem) {
        setFulfillmentType(orderItem.fulfillmentMethod || (isMedication ? 'pick_up' : 'lab_visit'));
        if (!isMedication && orderItem.timeSlotStart) {
          const slotDate = new Date(orderItem.timeSlotStart);
          setSelectedDate(slotDate);
          setSelectedTimeSlot(orderItem.timeSlotStart);
        }
      }
    }
  }, [isEditMode, lastAddedItemDetails, orders, isMedication]);

  useEffect(() => {
    if (!isMedication && openOrderDialog && lastAddedItemDetails?.providerId && lastAddedItemDetails?.serviceId) {
      const targetItem = lastAddedItemDetails;
      if (lastItemRef.current?.itemId !== targetItem.itemId || !lastItemRef.current) {
        lastItemRef.current = targetItem;
        fetchAndSetTimeSlots({
          providerId: targetItem.providerId,
          serviceId: targetItem.serviceId,
          fulfillmentType: fulfillmentType === 'pick_up' || fulfillmentType === 'home_delivery' ? 'lab_visit' : fulfillmentType,
          date: format(selectedDate, 'yyyy-MM-dd'),
        });
      }
    }
  }, [openOrderDialog, fulfillmentType, selectedDate, lastAddedItemDetails, isMedication]);

  const fetchAndSetTimeSlots = async (params) => {
    setIsLoadingSlots(true);
    setErrorMessage('');
    try {
      console.log('Fetching time slots with params:', params);
      const data = await fetchTimeSlots.mutateAsync(params);
      console.log('fetchTimeSlots response:', data);
      setTimeSlots(data.timeSlots || []);
      if (data.timeSlots?.length && !selectedTimeSlot) {
        setSelectedTimeSlot(data.timeSlots[0].start);
      } else if (!data.timeSlots?.length) {
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

  const formattedTimeSlots = useMemo(() => {
    if (!timeSlots || !Array.isArray(timeSlots)) {
      return [];
    }
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
      toast.error('Please select a delivery method', { duration: 4000 });
      return;
    }
    if (!isMedication && (!selectedTimeSlot || !fulfillmentType)) {
      toast.error('Please select a date, time slot, and fulfillment type', { duration: 4000 });
      return;
    }

    const targetItem = lastAddedItemDetails;

    if (!targetItem?.itemId) {
      toast.error('No valid item found', { duration: 4000 });
      return;
    }

    try {
      const updates = isMedication
        ? { itemId: targetItem.itemId, fulfillmentType }
        : {
            itemId: targetItem.itemId,
            timeSlotStart: set(new Date(selectedTimeSlot), {
              year: selectedDate.getFullYear(),
              month: selectedDate.getMonth(),
              date: selectedDate.getDate(),
            }).toISOString(),
            fulfillmentType,
          };
      await updateOrderDetails(updates);
      await fetchOrders();
      setOpenOrderDialog(false);
      toast.success(isMedication ? 'Delivery method updated!' : 'Booking updated successfully!', {
        duration: 4000,
      });
      if (!isEditMode) {
        router.push('/order');
      }
    } catch (error) {
      console.error('Failed to save details:', error);
      toast.error('Failed to save details', { duration: 4000 });
    }
  };

  return (
    <Dialog open={openOrderDialog} onOpenChange={setOpenOrderDialog}>
      <DialogContent
        className={`sm:max-w-md p-8 border ${
          isEditMode ? 'border-[#225F91]/30 bg-[#225F91]/5' : 'border-[#1ABA7F]/20 bg-white/95'
        } rounded-2xl backdrop-blur-lg shadow-xl animate-in slide-in-from-top-10 fade-in-20 duration-300`}
      >
        <div
          className={`absolute top-0 left-0 w-12 h-12 ${
            isEditMode ? 'bg-[#225F91]/20' : 'bg-[#1ABA7F]/20'
          } rounded-br-3xl`}
        />
        <DialogHeader className="flex flex-col items-center gap-3">
          {isEditMode ? (
            <Edit2 className={`h-12 w-12 ${isEditMode ? 'text-[#225F91]' : 'text-[#1ABA7F]'} animate-[pulse_1s_ease-in-out_infinite]`} />
          ) : (
            <CheckCircle className={`h-12 w-12 ${isEditMode ? 'text-[#225F91]' : 'text-[#1ABA7F]'} animate-[pulse_1s_ease-in-out_infinite]`} />
          )}
          <DialogTitle className={`text-2xl font-bold ${isEditMode ? 'text-[#225F91]' : 'text-[#225F91]'} tracking-tight text-center`}>
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <p id="dialog-description" className="text-center text-gray-600 text-base font-medium mt-2">
          {isEditMode ? (
            <>
              Update details for <span className="font-semibold text-gray-900">{lastAddedItem}</span> in your {actionText.toLowerCase()}.
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your {actionText.toLowerCase()}.
            </>
          )}
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
                onValueChange={setFulfillmentType}
              >
                <SelectTrigger
                  className={`mt-2 h-12 text-base rounded-2xl border ${
                    isEditMode ? 'border-[#225F91]/30 focus:border-[#225F91]/50' : 'border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50'
                  } bg-white/95 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300`}
                  aria-label="Select delivery method"
                >
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
            <div>
              <label htmlFor="date-picker" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Select Date
              </label>
              <DatePicker
                id="date-picker"
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                className={`mt-2 h-12 w-full rounded-2xl border ${
                  isEditMode ? 'border-[#225F91]/30 focus:border-[#225F91]/50' : 'border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50'
                } bg-white/95 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] pl-4 text-base transition-all duration-300`}
                wrapperClassName="w-full"
                calendarClassName="bg-white/95 border-[#1ABA7F]/20 rounded-2xl shadow-xl"
                dayClassName={() => 'text-gray-900 hover:bg-[#1ABA7F]/10 rounded-full'}
                popperClassName="z-50"
              />
            </div>
            <div>
              <label htmlFor="time-slot" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Select Time Slot
              </label>
              {isLoadingSlots ? (
                <Skeleton className="h-12 w-full rounded-2xl mt-2" />
              ) : errorMessage ? (
                <p className="text-red-600 text-sm mt-1" role="alert">
                  {errorMessage}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {formattedTimeSlots && formattedTimeSlots.length ? (
                    formattedTimeSlots.map((slot) => (
                      <Button
                        key={slot.value}
                        onClick={() => setSelectedTimeSlot(slot.value)}
                        className={cn(
                          'h-10 px-4 text-sm font-semibold rounded-full transition-all duration-300',
                          selectedTimeSlot === slot.value
                            ? isEditMode
                              ? 'bg-[#225F91] text-white border-[#225F91]'
                              : 'bg-[#1ABA7F] text-white border-[#1ABA7F]'
                            : 'bg-white border-[#1ABA7F]/20 hover:bg-[#1ABA7F]/10 hover:shadow-[0_0_10px_rgba(26,186,127,0.3)]',
                          slot.availabilityStatus === 'limited' ? 'opacity-75' : ''
                        )}
                        disabled={slot.availabilityStatus === 'booked'}
                        aria-label={`Select time slot ${slot.label}`}
                      >
                        {slot.label}
                        {slot.availabilityStatus === 'limited' && (
                          <span className="ml-1 text-xs"> (Limited)</span>
                        )}
                      </Button>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm mt-1" role="alert">
                      No available time slots. Try another date.
                    </p>
                  )}
                </div>
              )}
            </div>
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
                <SelectTrigger
                  className={`mt-2 h-12 text-base rounded-2xl border ${
                    isEditMode ? 'border-[#225F91]/30 focus:border-[#225F91]/50' : 'border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50'
                  } bg-white/95 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300`}
                  aria-label="Select fulfillment type"
                >
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
            className={`h-12 px-8 text-base font-semibold rounded-full border ${
              isEditMode ? 'border-[#225F91] text-[#225F91] hover:bg-[#225F91]/10' : 'border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10'
            } hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300`}
            aria-label={isEditMode ? 'Cancel' : continueText}
          >
            {isEditMode ? 'Cancel' : continueText}
          </Button>
          <Button
            onClick={handleSave}
            className={`h-12 px-8 text-base font-semibold rounded-full ${
              isEditMode ? 'bg-[#225F91] hover:bg-[#1A4971]' : 'bg-[#225F91] hover:bg-[#1A4971]'
            } text-white hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300 hover:scale-105`}
            disabled={isMedication ? !fulfillmentType : (!selectedTimeSlot || !fulfillmentType || isLoadingSlots)}
            aria-label={saveButtonText}
          >
            {saveButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;