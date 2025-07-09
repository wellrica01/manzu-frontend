import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

const RemoveItemDialog = ({ removeItem, setRemoveItem, handleRemoveItem, isUpdating }) => {
  return (
    <Dialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
      <DialogContent className="sm:max-w-md p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top fade-in-20 duration-300">
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
        <CheckCircle
          className="h-10 w-10 text-[#1ABA7F] mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91] text-center tracking-tight">
            Remove Item
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-gray-600 text-center font-medium">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-gray-900">{removeItem?.name}</span> from your cart?
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setRemoveItem(null)}
            className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F]/20 text-gray-700 hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_10px_rgba(26,186,127,0.2)] transition-all duration-300"
            aria-label="Cancel remove item"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemoveItem}
            className="h-12 px-6 text-base font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300"
            disabled={isUpdating[removeItem?.id]}
            aria-label="Confirm remove item"
          >
            {isUpdating[removeItem?.id] && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveItemDialog;