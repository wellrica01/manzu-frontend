import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useBooking } from '@/hooks/useBooking';
import BookingItem from './BookingItem';

const TestBookingCard = ({
  lab,
  booking,
  setRemoveItem,
  isUpdating,
  calculateBookingPrice,
}) => {
  const { updateBookingDetails, fetchTimeSlots } = useBooking();
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(booking.timeSlotStart || '');
  const [selectedFulfillment, setSelectedFulfillment] = useState(booking.fulfillmentType || 'Lab Visit');
  const [error, setError] = useState(null);

  // Log lab prop for debugging
  useEffect(() => {
    console.log('TestBookingCard lab prop:', lab);
  }, [lab]);

  useEffect(() => {
    async function loadTimeSlots() {
      if (!lab?.lab?.id) {
        setError('Invalid lab ID');
        toast.error('Failed to fetch time slots: Invalid lab ID', { duration: 4000 });
        return;
      }
      try {
        // Wrap fetchTimeSlots (mutate) in a promise
        const data = await new Promise((resolve, reject) => {
          fetchTimeSlots({ labId: lab.lab.id }, {
            onSuccess: (data) => resolve(data),
            onError: (error) => reject(error),
          });
        });
        console.log('Time slots fetched:', data.timeSlots);
        setTimeSlots(data.timeSlots || []);
      } catch (error) {
        setError(error.message);
        toast.error(`Failed to fetch time slots for ${lab.lab?.name || 'Unknown Lab'}: ${error.message}`, { duration: 4000 });
      }
    }
    loadTimeSlots();
  }, [lab?.lab?.id, fetchTimeSlots]);

  const handleScheduleChange = async (field, value) => {
    if (!booking.id) {
      toast.error('No booking found for this lab.', { duration: 4000 });
      return;
    }
    try {
      const updates = field === 'timeSlotStart'
        ? { timeSlotStart: value, fulfillmentType: selectedFulfillment }
        : { timeSlotStart: selectedTimeSlot, fulfillmentType: value };
      await new Promise((resolve, reject) => {
        updateBookingDetails({ bookingId: booking.id, ...updates }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });
      if (field === 'timeSlotStart') {
        setSelectedTimeSlot(value);
      } else {
        setSelectedFulfillment(value);
      }
      toast.success('Booking details updated!', { duration: 4000 });
    } catch (error) {
      toast.error(`Failed to update booking: ${error.message}`, { duration: 4000 });
    }
  };

  if (error || !lab?.lab) {
    return (
      <Card className="shadow-2xl border border-red-200 rounded-3xl overflow-hidden bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">
            Error loading data for lab: {error || 'Unknown lab'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardHeader className="bg-primary/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary truncate">
          {lab.lab.name}
        </CardTitle>
        <p className="text-gray-600 text-base font-medium truncate">{lab.lab.address}</p>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-4">
        {lab.items?.map((item) => (
          <BookingItem
            key={item.id}
            item={item}
            setRemoveItem={setRemoveItem}
            isUpdating={isUpdating}
            calculateBookingPrice={calculateBookingPrice}
          />
        ))}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            <Select
              value={selectedTimeSlot}
              onValueChange={(value) => handleScheduleChange('timeSlotStart', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.length === 0 ? (
                  <SelectItem value="no-slots" disabled>No time slots available</SelectItem>
                ) : (
                  timeSlots.map((slot) => (
                    <SelectItem key={slot.start} value={slot.start}>
                      {new Date(slot.start).toLocaleString('en-NG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fulfillment Type</label>
            <Select
              value={selectedFulfillment}
              onValueChange={(value) => handleScheduleChange('fulfillmentType', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose fulfillment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lab Visit">Lab Visit</SelectItem>
                {lab.lab.homeCollectionAvailable && (
                  <SelectItem value="Home Collection">Home Collection</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-lg font-semibold text-primary mt-4">
          Subtotal for {lab.lab.name}: ₦{lab.subtotal?.toLocaleString() || '0'}
        </p>
      </CardContent>
    </Card>
  );
};

export default TestBookingCard;