import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import CartItem from './CartItem';

const PharmacyCartCard = ({
  pharmacy,
  handleQuantityChange,
  setRemoveItem,
  isUpdating,
  calculateItemPrice,
}) => {
  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-[#1ABA7F]/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91] truncate">
          {pharmacy.pharmacy.name}
        </CardTitle>
        <p className="text-gray-600 text-base font-medium truncate">{pharmacy.pharmacy.address}</p>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-4">
        {pharmacy.items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            handleQuantityChange={handleQuantityChange}
            setRemoveItem={setRemoveItem}
            isUpdating={isUpdating}
            calculateItemPrice={calculateItemPrice}
          />
        ))}
        <p className="text-lg font-semibold text-[#225F91] mt-4">
          Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default PharmacyCartCard;