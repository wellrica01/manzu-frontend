import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  AlertCircle,
  X,
  Package
} from 'lucide-react';

export default function UnifiedRemoveDialog({ 
  removeItem,
  bulkRemoveItems,
  onClose, 
  onConfirm, 
  isRemoving 
}) {
  const isBulkRemove = bulkRemoveItems && bulkRemoveItems.length > 0;
  const isOpen = !!removeItem || isBulkRemove;
  const itemCount = isBulkRemove ? bulkRemoveItems.length : 1;
  const items = isBulkRemove ? bulkRemoveItems : removeItem ? [removeItem] : [];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={isRemoving ? undefined : onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-red-200">
        <VisuallyHidden>
          <DialogTitle>
            {isBulkRemove ? 'Bulk Remove Confirmation' : 'Remove Item Confirmation'}
          </DialogTitle>
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
                Remove {itemCount === 1 ? 'Item' : `${itemCount} Items`}?
              </h3>
              <p className="text-white/90 font-medium text-sm">
                {itemCount === 1 
                  ? 'This item will be removed from your cart'
                  : `${itemCount} items will be removed from your cart`
                }
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
              {itemCount === 1 ? 'Item to remove:' : 'Items to remove:'}
            </h3>
            
            {itemCount === 1 ? (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50/50 rounded-xl border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <Package className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 mb-1">
                      {items[0].name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: <span className="font-semibold text-red-600">{items[0].quantity}</span>
                    </p>
                  </div>
                  <X className="h-5 w-5 text-red-600 flex-shrink-0" strokeWidth={2.5} />
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gradient-to-r from-red-50 to-orange-50/50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 break-words">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Quantity: <span className="font-semibold text-red-600">{item.quantity}</span>
                        </p>
                      </div>
                    </div>
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
                {itemCount === 1
                  ? 'This item will be completely removed from your cart. You can add it back later if needed.'
                  : `These ${itemCount} items will be completely removed from your cart. You can add them back later if needed.`
                }
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRemoving}
              className="flex-1 h-12 sm:h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-bold text-sm sm:text-base transition-all disabled:opacity-50"
            >
              <X className="h-5 w-5 mr-2" strokeWidth={2.5} />
              Cancel
            </Button>
            
            <Button
              onClick={onConfirm}
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
                  Remove {itemCount > 1 && itemCount}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}