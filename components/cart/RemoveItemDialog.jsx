import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Package } from 'lucide-react';

const RemoveItemDialog = ({ removeItem, setRemoveItem, handleRemoveItem, isUpdating }) => {
  if (!removeItem) return null;

  return (
    <Dialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
      <DialogContent className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#225F91]">
              Remove Item
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 leading-relaxed">
            Are you sure you want to remove <span className="font-semibold text-[#225F91]">{removeItem.name}</span> from your cart?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">Item Details</p>
              <p className="text-sm text-red-700">
                <span className="font-medium">{removeItem.name}</span>
                {removeItem.quantity > 1 && (
                  <span> • Quantity: {removeItem.quantity}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setRemoveItem(null)}
            disabled={isUpdating[removeItem?.id]}
            className="w-full sm:w-auto border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemoveItem}
            disabled={isUpdating[removeItem?.id]}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
          >
            {isUpdating[removeItem?.id] ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveItemDialog;