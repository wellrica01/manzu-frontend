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
    <Card
      className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardHeader className="bg-primary/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary truncate">
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
        <p className="text-lg font-semibold text-primary mt-4">
          Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default PharmacyCartCard;