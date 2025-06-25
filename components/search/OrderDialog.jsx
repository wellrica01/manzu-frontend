import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrder } from '@/hooks/useOrder';
import Link from 'next/link';
import { toast } from 'sonner';

const OrderDialog = ({ openOrderDialog, setOpenOrderDialog, lastAddedItem, serviceType }) => {
  const isMedication = serviceType === 'medication';
  const dialogTitle = isMedication ? 'Added to Cart!' : 'Added to Booking!';
  const actionText = isMedication ? 'Cart' : 'Booking';
  const continueText = isMedication ? 'Continue Shopping' : 'Continue Searching';
  const { fetchTimeSlots, updateOrderDetails, order } = useOrder();
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('in_person');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (!isMedication && openOrderDialog && order.items?.length) {
      const lastItem = order.items[order.items.length - 1];
      if (lastItem?.providerId) {
        setIsLoadingSlots(true);
        fetchTimeSlots({ providerId: lastItem.providerId })
          .then((data) => {
            setTimeSlots(data.slots || []);
            setIsLoadingSlots(false);
          })
          .catch(() => {
            toast.error('Failed to load time slots');
            setIsLoadingSlots(false);
          });
      }
    }
  }, [openOrderDialog, isMedication, order.items, fetchTimeSlots]);

  const handleSaveBooking = async () => {
    if (!selectedTimeSlot || !fulfillmentType) {
      toast.error('Please select a time slot and fulfillment type');
      return;
    }
    const lastItem = order.items[order.items.length - 1];
    try {
      await updateOrderDetails({
        itemId: lastItem.itemId,
        timeSlotStart: selectedTimeSlot,
        fulfillmentType,
      });
      setOpenOrderDialog(false);
    } catch (error) {
      toast.error('Failed to save booking details');
    }
  };

  return (
    <Dialog open={openOrderDialog} onOpenChange={setOpenOrderDialog}>
      <DialogContent
        className="sm:max-w-md p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top-10 fade-in-20 duration-300"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
        <DialogHeader className="flex flex-col items-center gap-3">
          <CheckCircle
            className="h-12 w-12 text-[#1ABA7F] animate-[pulse_1s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <DialogTitle className="text-2xl font-bold text-[#225F91] tracking-tight text-center">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-gray-600 text-base font-medium mt-2">
          <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your {actionText.toLowerCase()}.
        </p>
        {!isMedication && (
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="time-slot"
                className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
              >
                Select Time Slot
              </label>
              <Select
                id="time-slot"
                value={selectedTimeSlot}
                onValueChange={setSelectedTimeSlot}
                disabled={isLoadingSlots || !timeSlots.length}
              >
                <SelectTrigger
                  className="mt-2 h-12 text-base rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
                >
                  <SelectValue placeholder={isLoadingSlots ? 'Loading...' : 'Choose a time slot'} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.length ? (
                    timeSlots.map((slot) => (
                      <SelectItem key={slot.start} value={slot.start}>
                        {new Date(slot.start).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No slots available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="fulfillment-type"
                className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
              >
                Fulfillment Type
              </label>
              <Select
                id="fulfillment-type"
                value={fulfillmentType}
                onValueChange={setFulfillmentType}
              >
                <SelectTrigger
                  className="mt-2 h-12 text-base rounded-xl border-[#1ABA7F]/20 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
                >
                  <SelectValue placeholder="Choose fulfillment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
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
            aria-label={continueText}
          >
            {continueText}
          </Button>
          {isMedication ? (
            <Button
              asChild
              className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300"
            >
              <Link href="/order" aria-label={`View ${actionText.toLowerCase()}`}>
                View {actionText}
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handleSaveBooking}
              className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300"
              disabled={!selectedTimeSlot || !fulfillmentType}
            >
              Save Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;