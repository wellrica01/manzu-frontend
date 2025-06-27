import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import OrderItem from './OrderItem';

const ProviderOrderCard = ({
  provider,
  handleQuantityChange,
  setRemoveItem,
  isUpdating,
  calculateItemPrice,
  setOpenOrderDialog,
  setLastAddedItemDetails,
}) => {
  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-[#1ABA7F]/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91] truncate">
          {provider.provider.name}
        </CardTitle>
        <p className="text-gray-600 text-base font-medium truncate">{provider.provider.address}</p>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-4">
        {provider.items.map((item) => (
          <OrderItem
            key={item.id}
            item={item}
            handleQuantityChange={handleQuantityChange}
            setRemoveItem={setRemoveItem}
            isUpdating={isUpdating}
            calculateItemPrice={calculateItemPrice}
            setOpenOrderDialog={setOpenOrderDialog}
            setLastAddedItemDetails={setLastAddedItemDetails}
          />
        ))}
        <p className="text-lg font-semibold text-[#225F91] mt-4">
          Subtotal for {provider.provider.name}: ₦{provider.subtotal.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProviderOrderCard;