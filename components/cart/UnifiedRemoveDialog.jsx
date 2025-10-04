// UnifiedRemoveDialog.jsx
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  AlertTriangle,
  X,
  ShieldAlert
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UnifiedRemoveDialog({ 
  removeItem,           // Single item: { id, name, quantity }
  bulkRemoveItems,      // Array of items: [{ id, name, quantity }, ...]
  onClose, 
  onConfirm, 
  isRemoving 
}) {
  const isBulkRemove = bulkRemoveItems && bulkRemoveItems.length > 0;
  const isOpen = !!removeItem || isBulkRemove;
  const itemCount = isBulkRemove ? bulkRemoveItems.length : 1;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border-2 border-red-200/50 rounded-3xl shadow-2xl overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>
            {isBulkRemove ? 'Bulk Remove Confirmation' : 'Remove Item Confirmation'}
          </DialogTitle>
        </VisuallyHidden>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-orange-500/10 to-transparent rounded-tl-full" />

        {/* Content */}
        <div className="relative z-10 space-y-6 pt-6">
          {/* Warning Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-in zoom-in-50 duration-500">
              <AlertTriangle className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-ping" />
          </div>

          {/* Warning Message */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              {isBulkRemove 
                ? `Remove ${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}?` 
                : 'Remove Item?'
              }
            </h3>
            <p className="text-sm text-gray-600">
              This action cannot be undone
            </p>
          </div>

          {/* Warning Details Card */}
          <div className="relative p-5 bg-gradient-to-br from-red-50 via-white to-orange-50/50 rounded-2xl border-2 border-red-200/60 shadow-lg overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-500/10 rounded-full blur-2xl" />
            </div>

            <div className="relative space-y-4">
              {/* Alert Header */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-red-900 mb-1">Confirm Removal</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {isBulkRemove
                      ? `You're about to remove ${itemCount} ${itemCount === 1 ? 'item' : 'items'} from your cart:`
                      : "You're about to remove this item from your cart:"
                    }
                  </p>
                </div>
              </div>

              {/* Items List */}
              {isBulkRemove ? (
                <ScrollArea className={`${bulkRemoveItems.length > 3 ? 'h-64' : 'h-auto'} pr-4`}>
                  <div className="space-y-3">
                    {bulkRemoveItems.map((item, index) => (
                      <div 
                        key={item.id}
                        className="p-3 bg-white rounded-lg border-2 border-red-200/50 shadow-sm animate-in fade-in slide-in-from-left duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#225F91] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Quantity: <span className="font-semibold text-red-600">{item.quantity}</span>
                            </p>
                          </div>
                          <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                /* Single Item Details */
                removeItem && (
                  <div className="p-4 bg-white rounded-xl border-2 border-red-200/50 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-[#225F91] mb-1">
                          {removeItem.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: <span className="font-semibold text-red-600">{removeItem.quantity}</span>
                        </p>
                      </div>
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRemoving}
            className="flex-1 h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-bold text-base transition-all duration-300 disabled:opacity-50"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>
          
          <Button
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex-1 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg hover:shadow-xl font-bold text-base transition-all duration-300 group relative overflow-hidden disabled:opacity-70"
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
                  {isBulkRemove ? `Remove ${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}` : 'Remove Item'}
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
}