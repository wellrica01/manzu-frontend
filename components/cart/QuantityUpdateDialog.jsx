import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Package, CheckCircle, Sparkles } from 'lucide-react';

const QuantityUpdateDialog = ({ quantityUpdate, setQuantityUpdate }) => {
  if (!quantityUpdate) return null;

  return (
    <Dialog open={!!quantityUpdate} onOpenChange={() => setQuantityUpdate(null)}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden">
        <VisuallyHidden>
          <h2>Quantity Updated Successfully</h2>
        </VisuallyHidden>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/20 to-transparent rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#225F91]/20 to-transparent rounded-tl-full" />

        {/* Content */}
        <div className="relative z-10 space-y-6 pt-6">
          {/* Success Icon with Animation */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/30 to-green-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F] to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-in zoom-in-50 duration-500">
              <CheckCircle className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
            {/* Sparkle effect */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
              Quantity Updated!
            </h3>
            <p className="text-sm text-gray-600">
              Your cart has been successfully updated
            </p>
          </div>

          {/* Item Details Card */}
          <div className="relative p-5 bg-gradient-to-br from-green-50 via-white to-green-50/50 rounded-2xl border-2 border-green-200/60 shadow-lg overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#1ABA7F]/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-500/10 rounded-full blur-2xl" />
            </div>

            <div className="relative flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#1ABA7F]/20 to-green-500/20 rounded-xl flex items-center justify-center border border-[#1ABA7F]/30">
                <Package className="h-6 w-6 text-[#1ABA7F]" />
              </div>

              {/* Text Content */}
              <div className="flex-1 space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-[#225F91]">{quantityUpdate.name}</span>
                  {' '}has been updated to
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 border-[#1ABA7F]/30 shadow-sm">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Quantity:</span>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1ABA7F] to-green-600">
                    {quantityUpdate.quantity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <DialogFooter className="relative z-10 pt-4">
          <Button
            onClick={() => setQuantityUpdate(null)}
            className="w-full h-14 bg-gradient-to-r from-[#1ABA7F] to-green-600 hover:from-green-600 hover:to-[#1ABA7F] text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Continue Shopping
              <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityUpdateDialog;