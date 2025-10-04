"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  ShoppingBag, 
  ArrowRight, 
  ShoppingCart, 
  Pill, 
  Trash2,
  X,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const CartDialog = ({ 
  openCartDialog, 
  setOpenCartDialog, 
  lastAddedItems,
  onRemoveItems, // Function to handle removal: (itemIds: string[]) => Promise<void>
  isRemoving = false
}) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  
  const items = Array.isArray(lastAddedItems)
    ? lastAddedItems
    : lastAddedItems
    ? [lastAddedItems]
    : [];

  const isSingleItem = items.length === 1;

  const handleRemove = async () => {
    try {
      const itemIds = items.map(item => item.id);
      await onRemoveItems(itemIds);
      setOpenCartDialog(false);
      setShowRemoveConfirm(false);
      toast.success(
        isSingleItem 
          ? 'Item removed from cart' 
          : `${items.length} items removed from cart`,
        { duration: 2000 }
      );
    } catch (error) {
      toast.error('Failed to remove items', { duration: 3000 });
    }
  };

  // Success view
  if (!showRemoveConfirm) {
    return (
      <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Items Added to Cart</DialogTitle>
          </VisuallyHidden>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-br-full" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-tl-full" />

          <div className="relative z-10 space-y-6 pt-6">
            {/* Success Icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/30 to-[#225F91]/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F] to-[#16a876] rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-in zoom-in-50 duration-500">
                <CheckCircle className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
              {/* Sparkle effect */}
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-[#1ABA7F] animate-pulse" />
            </div>

            {/* Success Message */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1ABA7F] to-[#225F91]">
                Added to Cart!
              </h3>
              <p className="text-sm text-gray-600">
                {isSingleItem ? 'Your item is ready' : `${items.length} items are ready`}
              </p>
            </div>

            {/* Items Details Card */}
            <div className="relative p-5 bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 rounded-2xl border-2 border-[#1ABA7F]/20 shadow-lg overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#1ABA7F]/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#225F91]/10 rounded-full blur-2xl" />
              </div>

              <div className="relative">
                {isSingleItem ? (
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
                      <Pill className="h-6 w-6 text-[#225F91]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#225F91] mb-1">
                        {items[0].name}
                      </p>
                      <p className="text-sm text-gray-600">
                        from <span className="font-semibold text-[#225F91]">{items[0].pharmacy}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl mb-2">
                        <Pill className="h-6 w-6 text-[#225F91]" />
                      </div>
                      <p className="text-base text-gray-700">
                        <span className="font-bold text-[#225F91] text-lg">{items.length} medications</span>
                        {' '}from{' '}
                        <span className="font-semibold text-[#225F91]">{items[0]?.pharmacy}</span>
                      </p>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-[#1ABA7F]/20"
                        >
                          <CheckCircle className="h-4 w-4 text-[#1ABA7F] flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 flex-1">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              asChild
              className="flex-1 h-14 p-3 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all duration-300 group relative overflow-hidden"
            >
              <Link href="/cart">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  View Cart
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => setOpenCartDialog(false)}
              className="flex-1 h-12 p-3 border-2 border-[#225F91]/30 text-[#225F91] hover:bg-[#225F91]/10 rounded-xl font-bold transition-all duration-300 group"
            >
              <ShoppingBag className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Continue Shopping
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowRemoveConfirm(true)}
              className="h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-semibold transition-all duration-300 group"
            >
              <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Remove confirmation view
  return (
    <Dialog open={openCartDialog} onOpenChange={() => {
      setOpenCartDialog(false);
      setShowRemoveConfirm(false);
    }}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border-2 border-red-200/50 rounded-3xl shadow-2xl overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Remove Items Confirmation</DialogTitle>
        </VisuallyHidden>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-orange-500/10 to-transparent rounded-tl-full" />

        <div className="relative z-10 space-y-6 pt-6">
          {/* Warning Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              <Trash2 className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              Remove {isSingleItem ? 'Item' : `${items.length} Items`}?
            </h3>
            <p className="text-sm text-gray-600">
              {isSingleItem 
                ? 'This item will be removed from your cart'
                : 'These items will be removed from your cart'
              }
            </p>
          </div>

          {/* Items List */}
          <div className="relative p-5 bg-gradient-to-br from-red-50 via-white to-orange-50/50 rounded-2xl border-2 border-red-200/60 shadow-lg">
            {isSingleItem ? (
              <div className="p-3 bg-white rounded-lg border-2 border-red-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#225F91]">
                      {items[0].name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      from <span className="font-semibold">{items[0].pharmacy}</span>
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border-2 border-red-200/50 animate-in fade-in slide-in-from-left duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#225F91] truncate">
                          {item.name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowRemoveConfirm(false)}
            disabled={isRemoving}
            className="flex-1 h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-bold transition-all duration-300"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>

          <Button
            onClick={handleRemove}
            disabled={isRemoving}
            className="flex-1 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all duration-300 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isRemoving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Remove {!isSingleItem && `${items.length} Items`}
                </>
              )}
            </span>
            {!isRemoving && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;