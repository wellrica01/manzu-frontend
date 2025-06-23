import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import PharmacyItems from './PharmacyItems';

const OrderSummary = ({ cart, calculateItemPrice, prescriptionStatuses }) => {
  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-[#1ABA7F]/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91]">
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <PharmacyItems cart={cart} calculateItemPrice={calculateItemPrice} prescriptionStatuses={prescriptionStatuses} />
        <div className="text-right mt-4">
          <p className="text-xl font-bold text-[#225F91]">
            Total: ₦{cart.totalPrice.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;