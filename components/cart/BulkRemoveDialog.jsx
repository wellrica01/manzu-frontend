import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function BulkRemoveDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemCount,
  isRemoving 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border-2 border-red-200/50 rounded-3xl shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Bulk Remove Confirmation</DialogTitle>
        </VisuallyHidden>

        <div className="relative z-10 space-y-6 pt-6">
          {/* Warning Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              <AlertTriangle className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              Remove {itemCount} Items?
            </h3>
            <p className="text-sm text-gray-600">
              This will remove all selected items from your cart
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-red-50 via-white to-orange-50/50 rounded-2xl border-2 border-red-200/60">
            <p className="text-center text-gray-700">
              You're about to remove <span className="font-bold text-red-600">{itemCount}</span> {itemCount === 1 ? 'item' : 'items'} from your cart. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRemoving}
            className="flex-1 h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-bold"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>
          
          <Button
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex-1 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg font-bold"
          >
            {isRemoving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 mr-2" />
                Remove Items
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}