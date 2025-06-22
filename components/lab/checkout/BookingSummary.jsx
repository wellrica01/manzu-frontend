import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import LabItems from './LabItems';

const BookingSummary = ({ cart, calculateItemPrice, testOrderStatuses }) => {
  return (
    <Card
      className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardHeader className="bg-primary/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <LabItems cart={cart} calculateItemPrice={calculateItemPrice} testOrderStatuses={testOrderStatuses} />
        <div className="text-right">
          <p className="text-xl font-extrabold text-primary">
            Total: ₦{cart.totalPrice.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;