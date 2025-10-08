import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CartSummary = ({ segments, handleCheckout, activeTab }) => {
  const isReadyTab = activeTab === 'ready';
  const hasReadyItems = segments?.readyForCheckout?.length > 0;

  if (!isReadyTab) return null;

  return (
    <Card className="bg-white border-2 border-[#1ABA7F]/30 rounded-2xl shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1ABA7F]/10 rounded-xl">
            <ShoppingCart className="h-6 w-6 text-[#225F91]" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-black text-[#225F91]">Order Summary</h3>
        </div>

        {hasReadyItems ? (
          <>
            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <Package className="h-4 w-4" strokeWidth={2} />
                  Items Ready
                </span>
                <span className="text-base font-black text-[#225F91]">
                  {segments.readyItemsCount}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-800">Total</span>
                  <span className="text-2xl font-black text-green-900">
                    ₦{segments.totalPrice?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              className="w-full h-14 text-base font-bold bg-[#225F91] text-white hover:bg-[#1a4a73] rounded-xl transition-colors duration-200 group"
            >
              <span className="flex items-center gap-2">
                Proceed to Checkout
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2} />
              </span>
            </Button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-gray-700 font-bold mb-2">No Ready Medications</p>
            <p className="text-sm text-gray-500">
              Complete prescription requirements
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default CartSummary;