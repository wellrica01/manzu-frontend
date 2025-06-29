import { Button } from '@/components/ui/button';
import { getStatusSummary } from '@/lib/utils';

const OrderSummary = ({ order, handleCheckout, handlePartialCheckout, hasPayableItems, allPrescriptionsVerified }) => {
  const allItems = order?.providers?.flatMap((provider) => provider.items) || [];
  const totalItems = allItems.length;
  const readyItems = allItems.filter(
    (item) => !item.service.prescriptionRequired || item.prescriptions?.some(p => p.status === 'verified')
  ).length;
  const progressText = totalItems > 0 ? `Order: ${readyItems}/${totalItems} items ready` : 'No items';

  return (
    <div className="text-right mt-8">
      <p className="text-xl font-bold text-[#225F91] mb-2" id={`order-status-${order.orderId}`}>
        {getStatusSummary(allItems)}
      </p>
      <p className="text-xl font-bold text-[#225F91] mb-4">
        Total: ₦{(order?.totalPrice / 100 || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className="flex flex-col sm:flex-row justify-end gap-4">
        {(hasPayableItems && !allPrescriptionsVerified) && (
          <Button
            variant="outline"
            className="h-12 px-8 text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10"
            onClick={handlePartialCheckout}
            aria-label={`Checkout ready items for Order #${order.orderId}`}
            aria-describedby={`order-status-${order.orderId}`}
            title="Pay for items that are either non-prescription or have verified prescriptions now."
          >
            Checkout Ready Items
          </Button>
        )}
        <Button
          className="h-12 px-8 text-base font-semibold rounded-full bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
          onClick={handleCheckout}
          disabled={order.providers.length === 0 || (!allPrescriptionsVerified && !hasPayableItems)}
          aria-label={`Proceed to checkout for Order #${order.orderId}`}
          aria-describedby={`order-status-${order.orderId}`}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default OrderSummary;