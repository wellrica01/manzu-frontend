import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CartSummary = ({ segments, handleCheckout, activeTab }) => {
  const isReadyTab = activeTab === 'ready';
  const hasReadyItems = segments?.readyForCheckout?.length > 0;

  if (!isReadyTab) return null;

  return (
    <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/30 rounded-2xl shadow-xl overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#1ABA7F]/20 to-transparent rounded-br-3xl" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[#225F91]/20 to-transparent rounded-tl-3xl" />

      <CardContent className="relative z-10 p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
            <ShoppingCart className="h-6 w-6 text-[#225F91]" />
          </div>
          <h3 className="text-xl font-black text-[#225F91]">Order Summary</h3>
        </div>

        {hasReadyItems ? (
          <>
            {/* Summary Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items Ready
                </span>
                <span className="text-base font-bold text-[#225F91]">
                  {segments.readyItemsCount}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100/50 border-2 border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-800">Total Amount</span>
                  <span className="text-2xl font-black text-green-900">
                    ₦{segments.totalPrice?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              className="w-full h-14 text-base font-bold bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Proceed to Checkout
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-2">No Ready Medications</p>
            <p className="text-sm text-gray-500">
              Complete prescription requirements to proceed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CartSummary;