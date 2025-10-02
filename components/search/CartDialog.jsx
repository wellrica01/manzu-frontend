import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const CartDialog = ({ openCartDialog, setOpenCartDialog, lastAddedItems }) => {
  const items = Array.isArray(lastAddedItems) ? lastAddedItems : lastAddedItems ? [lastAddedItems] : [];

  return (
    <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
      <DialogContent className="sm:max-w-md p-0 border-0 rounded-3xl bg-white overflow-hidden shadow-2xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/20 to-transparent rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#225F91]/20 to-transparent rounded-tl-full" />
        
        <div className="relative z-10 p-8">
          {/* Success icon with animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#1ABA7F] to-[#16a876] flex items-center justify-center shadow-xl">
                <CheckCircle className="w-10 h-10 text-white animate-in zoom-in-50 duration-500" />
              </div>
            </div>
          </div>

          <DialogHeader className="flex flex-col items-center gap-3 mb-6">
            <DialogTitle className="text-2xl sm:text-3xl font-black text-[#225F91] tracking-tight text-center">
              Added to Cart!
            </DialogTitle>
          </DialogHeader>

          <div className="text-center mb-8 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
            {items.length === 1 ? (
              <p className="text-base text-gray-600">
                <span className="font-bold text-[#225F91] text-lg">{items[0]}</span>
                <br />
                <span className="text-sm">is now in your cart</span>
              </p>
            ) : (
              <div>
                <p className="text-base text-gray-600 mb-3">
                  <span className="font-bold text-[#225F91] text-lg">{items.length} medications</span> added:
                </p>
                <ul className="space-y-2 text-left">
                  {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-[#1ABA7F] flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setOpenCartDialog(false)}
              className="group flex-1 h-12 px-6 text-sm font-bold rounded-xl border-2 border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 transition-all duration-300 hover:scale-105"
            >
              <ShoppingBag className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Add Another
            </Button>
            <Button
              asChild
              className="group flex-1 h-12 px-6 text-sm font-bold rounded-xl bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
            >
              <Link href="/cart" aria-label="View cart">
                <span className="relative z-10 flex items-center gap-2">
                  View Cart
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;