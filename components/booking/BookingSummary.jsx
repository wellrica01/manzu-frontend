import { Button } from '@/components/ui/button';

const BookingSummary = ({ booking, handleConfirm }) => {
  return (
    <div className="text-right mt-6">
      <p className="text-xl font-extrabold text-primary mb-4">
        Total: ₦{booking.totalPrice.toLocaleString()}
      </p>
      <Button
        className="h-12 px-8 text-lg font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300"
        onClick={handleConfirm}
        disabled={booking.labs.length === 0}
        aria-label="Confirm booking"
      >
        Confirm Booking
      </Button>
    </div>
  );
};

export default BookingSummary;