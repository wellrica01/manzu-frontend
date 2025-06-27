import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import OrderItem from './OrderItem';

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
  fetchOrder
}) => {
  // Filter items by type (medication or diagnostic)
  const filteredItems = provider.items.filter((item) =>
    type === 'medication'
      ? item.service.type === 'medication'
      : item.service.type === 'diagnostic' || item.service.type === 'diagnostic_package'
  );

  // Calculate provider-level prescription status summary
  const getStatusSummary = (items) => {
    const nonPrescription = items.filter((item) => !item.service.prescriptionRequired).length;
    const verified = items.filter(
      (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'verified')
    ).length;
    const pending = items.filter(
      (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'pending')
    ).length;
    const rejected = items.filter(
      (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'rejected')
    ).length;
    const parts = [];
    if (nonPrescription) parts.push(`${nonPrescription} OTC`);
    if (verified) parts.push(`${verified} verified`);
    if (pending) parts.push(`${pending} pending`);
    if (rejected) parts.push(`${rejected} rejected`);
    return parts.length ? `Prescription Status: ${parts.join(', ')}` : 'No items';
  };

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
            setOpenUploadModal={setOpenUploadModal}
            fetchOrder={fetchOrder}
          />
        ))}
        <p className="text-lg font-semibold text-[#225F91] mt-4">
          Subtotal for {provider.provider.name}: ₦{provider.subtotal.toLocaleString()}
        </p>
        <p className="text-lg font-semibold text-[#225F91] mt-2" aria-label={`Prescription status for ${provider.provider.name}`}>
          {getStatusSummary(filteredItems)}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProviderOrderCard;