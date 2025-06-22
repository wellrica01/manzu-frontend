import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

const CartDialog = ({ openCartDialog, setOpenCartDialog, lastAddedItem }) => {
  return (
    <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
      <DialogContent
        className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <DialogHeader className="flex flex-col items-center gap-3">
          <CheckCircle
            className="h-12 w-12 text-green-500 animate-[pulse_1s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <DialogTitle className="text-2xl font-extrabold text-primary tracking-tight text-center">
            Added to Cart!
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-gray-600 text-base font-medium mt-2">
          <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your cart.
        </p>
        <DialogFooter className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setOpenCartDialog(false)}
            className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
            aria-label="Continue shopping"
          >
            Continue Shopping
          </Button>
          <Button
            asChild
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
          >
            <Link href="/med/cart" aria-label="View cart">
              View Cart
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;