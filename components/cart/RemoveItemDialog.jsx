import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function RemoveItemDialog({ removeItem, setRemoveItem, handleRemoveItem, isUpdating }) {
  if (!removeItem) return null;

  const isRemoving = isUpdating[removeItem.id];

  return (
    <Dialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl">


        <div className="space-y-6">
          {/* Warning Message */}
          <div className="p-4 mt-6 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#225F91] mb-2">Remove from Cart?</h3>
                <p className="text-sm text-gray-700">
                  Are you sure you want to remove <span className="font-medium text-[#225F91]">{removeItem.name}</span> from your cart? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 sm:pt-4">
            <Button
              variant="outline"
              onClick={() => setRemoveItem(null)}
              disabled={isRemoving}
              className="flex-1 h-12 border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleRemoveItem}
              disabled={isRemoving}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg"
            >
              {isRemoving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}