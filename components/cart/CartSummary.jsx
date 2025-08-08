import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const CartSummary = ({ segments, handleCheckout, activeTab }) => {
  const isReadyTab = activeTab === 'ready';
  const hasReadyItems = segments?.readyForCheckout?.length > 0;

  if (!isReadyTab) return null;

  return (
    <Card className="relative bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />

      <CardContent className="space-y-6">
        {hasReadyItems && (
          <div className="bg-green-50 rounded-2xl border border-green-200 shadow-sm">
            <div className="flex justify-between items-center py-3 bg-green-100 rounded-lg px-4">
              <span className="text-xl font-semibold text-[#225F91]">Total Amount: </span>
              <span className="text-xl font-bold text-[#225F91]">
                ₦{segments.totalPrice?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleCheckout}
            disabled={!hasReadyItems}
            className={cn(
              "w-full sm:w-auto h-12 px-4 bg-[#225F91] text-white hover:bg-[#1A4971]",
              !hasReadyItems && "border-gray-300 text-gray-500 bg-gray-50 cursor-not-allowed"
            )}
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            {hasReadyItems ? 'Proceed to Checkout' : 'No Ready Medications'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;