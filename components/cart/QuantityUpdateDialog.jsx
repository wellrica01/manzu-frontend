import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const QuantityUpdateDialog = ({ quantityUpdate, setQuantityUpdate, handleCheckout }) => {
  return (
    <Dialog open={!!quantityUpdate} onOpenChange={() => setQuantityUpdate(null)}>
      <DialogContent className="sm:max-w-md p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top fade-in-20 duration-300">
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
        <CheckCircle
          className="h-10 w-10 text-[#1ABA7F] mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91] text-center tracking-tight">
            Quantity Updated
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-gray-600 text-center font-medium">
            Quantity for{' '}
            <span className="font-semibold text-gray-900">{quantityUpdate?.name}</span> updated to{' '}
            {quantityUpdate?.quantity}.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setQuantityUpdate(null)}
            className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F]/20 text-gray-700 hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_10px_rgba(26,186,127,0.2)] transition-all duration-300"
            aria-label="Continue shopping"
          >
            Continue Shopping
          </Button>
          <Button
            onClick={handleCheckout}
            className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)] transition-all duration-300"
            aria-label="Proceed to checkout"
          >
            Proceed to Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityUpdateDialog;