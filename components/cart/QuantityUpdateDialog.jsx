import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, CheckCircle, ArrowRight } from 'lucide-react';

const QuantityUpdateDialog = ({ quantityUpdate, setQuantityUpdate, handleCheckout }) => {
  if (!quantityUpdate) return null;

  return (
    <Dialog open={!!quantityUpdate} onOpenChange={() => setQuantityUpdate(null)}>
      <DialogContent className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#1ABA7F]/20 rounded-xl">
              <CheckCircle className="h-6 w-6 text-[#1ABA7F]" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#225F91]">
              Quantity Updated
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 leading-relaxed">
            The quantity for <span className="font-semibold text-[#225F91]">{quantityUpdate.name}</span> has been updated to <span className="font-semibold text-[#1ABA7F]">{quantityUpdate.quantity}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-gradient-to-r from-[#1ABA7F]/10 to-green-50 rounded-xl border border-[#1ABA7F]/20 mb-6">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-[#1ABA7F] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#225F91] mb-1">Item Updated Successfully</p>
              <p className="text-sm text-[#1ABA7F]/70">
                Your cart has been updated with the new quantity.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setQuantityUpdate(null)}
            className="w-full sm:w-auto border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
          >
            Continue Shopping
          </Button>
          <Button
            onClick={handleCheckout}
            className="w-full sm:w-auto bg-gradient-to-r from-[#1ABA7F] to-[#1ABA7F]/90 hover:from-[#1ABA7F]/90 hover:to-[#1ABA7F] text-white shadow-lg hover:shadow-xl"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Proceed to Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityUpdateDialog;