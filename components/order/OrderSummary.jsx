import { Button } from '@/components/ui/button';

const OrderSummary = ({ order, handleCheckout, handlePartialCheckout, hasNonPrescriptionItems, allPrescriptionsVerified }) => {
  const allItems = order?.providers?.flatMap((provider) => provider.items) || [];
  const nonPrescription = allItems.filter((item) => !item.service.prescriptionRequired).length;
  const verified = allItems.filter(
    (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'verified')
  ).length;
  const pending = allItems.filter(
    (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'pending')
  ).length;
  const rejected = allItems.filter(
    (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'rejected')
  ).length;
  const totalItems = allItems.length;
  const readyItems = nonPrescription + verified;
  const progressText = totalItems > 0 ? `Order: ${readyItems}/${totalItems} items ready${pending ? `, ${pending} pending` : ''}${rejected ? `, ${rejected} rejected` : ''}` : 'No items';

  return (
    <div className="text-right mt-8">
      <p className="text-xl font-bold text-[#225F91] mb-2">{progressText}</p>
      <p className="text-xl font-bold text-[#225F91] mb-4">
        Total: ₦{(order.totalPrice / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
      </p>
      <div className="flex flex-col sm:flex-row justify-end gap-4">
        {hasNonPrescriptionItems && (
          <Button
            className="h-12 px-8 text-base font-semibold rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
            onClick={handlePartialCheckout}
            aria-label="Checkout OTC and routine lab items"
            title="Pay for items not requiring prescriptions now. Others will be available after verification."
          >
            Checkout OTC & Routine Labs Now
          </Button>
        )}
        <Button
          className="h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)] transition-all duration-300"
          onClick={handleCheckout}
          disabled={order.providers.length === 0 || (!allPrescriptionsVerified && !hasNonPrescriptionItems)}
          aria-label="Proceed to checkout"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default OrderSummary;