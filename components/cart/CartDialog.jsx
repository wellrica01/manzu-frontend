import React, { useState } from 'react';
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
  Sparkles,
  AlertCircle,
  Package
} from 'lucide-react';
import Link from 'next/link';

const CartDialog = ({ 
  openCartDialog, 
  setOpenCartDialog, 
  lastAddedItems,
  onRemoveItems,
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
    } catch (error) {
      console.error('Failed to remove items:', error);
    }
  };

  // Success view
  if (!showRemoveConfirm) {
    return (
      <Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-green-200">
          <VisuallyHidden>
            <DialogTitle>Items Added to Cart</DialogTitle>
          </VisuallyHidden>

          {/* Header */}
          <div className="bg-gradient-to-r bg-[#1ABA7F] p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
            
            {/* Success Icon with animation */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                  <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={3} />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-300 animate-pulse" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-black mb-1">
                  Added to Cart!
                </h3>
                <p className="text-white/90 font-medium text-sm">
                  {isSingleItem ? '1 item' : `${items.length} items`} ready for checkout
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-5">
            {/* Items Display */}
            <div className="space-y-3">
              {isSingleItem ? (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 rounded-xl border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Pill className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 mb-1">
                        {items[0].name}
                      </p>
                      <p className="text-sm text-gray-600">
                        from <span className="font-semibold text-green-700">{items[0].pharmacy}</span>
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary Card */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 rounded-xl border-2 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-900">
                          {items.length} medications added
                        </p>
                        <p className="text-sm text-gray-600">
                          from <span className="font-semibold text-green-700">{items[0]?.pharmacy}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200/60 hover:border-green-300 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" strokeWidth={2.5} />
                        <span className="text-sm font-medium text-gray-700 flex-1">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Hint */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-center text-blue-700 font-medium">
                💡 Ready to checkout? View your cart to complete your order
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                asChild
                className="w-full h-12 sm:h-14 rounded-xl font-black text-sm sm:text-base bg-gradient-to-r from-[#1ABA7F] via-[#1ABA7F] to-[#225F91] text-white hover:scale-[1.02] transition-all duration-300 shadow-lg group"
              >
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                  View Cart & Checkout
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                </Link>
              </Button>

              <Button
                variant="outline"
                onClick={() => setOpenCartDialog(false)}
                className="w-full h-11 sm:h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-bold text-sm transition-all duration-300 group"
              >
                <ShoppingBag className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                Continue Shopping
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full h-10 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-all group"
              >
                <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                Remove from Cart
              </Button>
            </div>
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
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-red-200">
        <VisuallyHidden>
          <DialogTitle>Remove Items Confirmation</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={3} />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-black mb-1">
                Remove {isSingleItem ? 'Item' : 'Items'}?
              </h3>
              <p className="text-white/90 font-medium text-sm">
                This will remove {isSingleItem ? 'this item' : `${items.length} items`} from your cart
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Items to Remove */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {isSingleItem ? 'Item to remove:' : 'Items to remove:'}
            </h3>
            
            {isSingleItem ? (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50/50 rounded-xl border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <Pill className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 mb-1">
                      {items[0].name}
                    </p>
                    <p className="text-sm text-gray-600">
                      from <span className="font-semibold">{items[0].pharmacy}</span>
                    </p>
                  </div>
                  <X className="h-5 w-5 text-red-600 flex-shrink-0" strokeWidth={2.5} />
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-orange-50/50 rounded-lg border border-red-200"
                  >
                    <X className="h-4 w-4 text-red-600 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700 font-medium leading-relaxed">
                {isSingleItem 
                  ? 'This item will be completely removed from your cart. You can add it back later if needed.'
                  : 'These items will be completely removed from your cart. You can add them back later if needed.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowRemoveConfirm(false)}
              disabled={isRemoving}
              className="flex-1 h-12 sm:h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-bold text-sm sm:text-base transition-all disabled:opacity-50"
            >
              <X className="h-5 w-5 mr-2" strokeWidth={2.5} />
              Cancel
            </Button>

            <Button
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg font-bold text-sm sm:text-base transition-all duration-300 group disabled:opacity-70"
            >
              {isRemoving ? (
                <>
                  <div className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                  Remove {!isSingleItem && items.length}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;