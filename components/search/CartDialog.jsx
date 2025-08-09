import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

const CartDialog = ({ openCartDialog, setOpenCartDialog, lastAddedItem }) => {
  return (
    <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
      <DialogContent
        className="sm:max-w-md p-3 sm:p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top-10 fade-in-20 duration-300"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
        <DialogHeader className="mt-6 flex flex-col items-center gap-3">
          <DialogTitle className="text-base sm:text-2xl font-bold text-[#225F91] tracking-tight text-center">
            Added to Cart!
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-gray-600 text-base font-medium mt-2">
          <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your cart.
        </p>
        <DialogFooter className="mb-2 p-1 sm:mt-8 flex justify-center gap-3 sm:gap-4">
          <div className="flex gap-3 pt-2 sm:pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenCartDialog(false)}
              className="flex-1 h-12 px-6 text-sm font-semibold rounded-lg border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
            >
              Add Another
            </Button>
            
            <Button
            asChild
              className="flex-1 h-12 text-sm font-semibold rounded-lg bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300"
            >
              <Link href="/cart" aria-label="View cart">
                View Cart
              </Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;