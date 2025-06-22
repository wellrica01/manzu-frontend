import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const QuantityUpdateDialog = ({ quantityUpdate, setQuantityUpdate, handleCheckout }) => {
  return (
    <Dialog open={!!quantityUpdate} onOpenChange={() => setQuantityUpdate(null)}>
      <DialogContent
        className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CheckCircle
          className="h-10 w-10 text-green-500 mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
            Quantity Updated
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-gray-600 text-center font-medium">
            Quantity for{' '}
            <span className="font-semibold text-gray-900">{quantityUpdate?.name}</span> updated to {quantityUpdate?.quantity}.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setQuantityUpdate(null)}
            className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
            aria-label="Continue shopping"
          >
            Continue Shopping
          </Button>
          <Button
            onClick={handleCheckout}
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
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