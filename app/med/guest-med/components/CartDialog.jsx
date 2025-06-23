import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

const CartDialog = ({ openCartDialog, setOpenCartDialog, lastAddedItem }) => {
  return (
    <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
      <DialogContent className="sm:max-w-md p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
        <DialogHeader className="flex flex-col items-center gap-3">
          <CheckCircle className="h-12 w-12 text-[#1ABA7F]" aria-hidden="true" />
          <DialogTitle className="text-2xl font-bold text-[#225F91] text-center">
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
            className="h-12 px-6 text-sm font-semibold rounded-full border-[#1ABA7F]/20 text-gray-700 hover:bg-[#1ABA7F]/10"
            aria-label="Continue shopping"
          >
            Continue Shopping
          </Button>
          <Button
            asChild
            className="h-12 px-6 text-sm font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971]"
          >
            <Link href="/cart" aria-label="View cart">View Cart</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;