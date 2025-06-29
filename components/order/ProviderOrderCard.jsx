import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import OrderItem from './OrderItem';
import { getStatusSummary } from '@/lib/utils';

const ProviderOrderCard = ({
  provider,
  type,
  handleQuantityChange,
  setRemoveItem,
  isUpdating,
  calculateItemPrice,
  setOpenOrderDialog,
  setLastAddedItemDetails,
  setIsEditMode,
  setOpenUploadModal,
  fetchOrders,
  orderId
}) => {
  const filteredItems = provider.items.filter((item) =>
    type === 'medication'
      ? item.service.type === 'medication'
      : item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package'
  );

  const subtotal = provider.subtotal !== undefined ? provider.subtotal / 100 : 0;
  if (provider.subtotal === undefined) {
    console.warn(`Subtotal is undefined for provider ${provider.provider.name} (ID: ${provider.provider.id})`);
  }

  return (
    <Card className="relative bg-white/95 border-l-4 border-[#1ABA7F]/30 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-[#1ABA7F]/10 p-8 sm:p-10 border-b border-[#1ABA7F]/20">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91]">
          {provider.provider.name}
        </CardTitle>
        <p className="text-base sm:text-lg text-gray-700 font-medium">{provider.provider.address}</p>
      </CardHeader>
      <CardContent className="p-8 sm:p-10 space-y-6">
        {filteredItems.map((item) => (
          <OrderItem
            key={item.id}
            item={item}
            providerName={provider.provider.name}
            handleQuantityChange={handleQuantityChange}
            setRemoveItem={setRemoveItem}
            isUpdating={isUpdating}
            calculateItemPrice={calculateItemPrice}
            setOpenOrderDialog={setOpenOrderDialog}
            setLastAddedItemDetails={setLastAddedItemDetails}
            setIsEditMode={setIsEditMode}
            setOpenUploadModal={(modalProps) => setOpenUploadModal({ ...modalProps, orderId })}
            fetchOrders={fetchOrders}
          />
        ))}
      </CardContent>
      <div className="bg-[#1ABA7F]/5 p-6 sm:p-8 border-t border-[#1ABA7F]/20">
        <p className="text-lg sm:text-xl font-semibold text-[#225F91]">
          Subtotal for {provider.provider.name}: ₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-base sm:text-lg font-semibold text-[#225F91] mt-2" id={`provider-status-${provider.provider.id}-${orderId}`} aria-label={`Prescription status for ${provider.provider.name} in Order #${orderId}`}>
          {getStatusSummary(filteredItems)}
        </p>
      </div>
    </Card>
  );
};

export default ProviderOrderCard;