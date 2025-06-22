import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

const RemoveBookingItemDialog = ({ removeItem, setRemoveItem, handleRemoveItem, isUpdating }) => {
  return (
    <Dialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
      <DialogContent
        className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CheckCircle
          className="h-10 w-10 text-green-500 mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
            Remove Test
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-gray-600 text-center font-medium">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-gray-900">{removeItem?.name}</span> from your booking?
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setRemoveItem(null)}
            className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
            aria-label="Cancel remove test"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemoveItem}
            className="h-12 px-6 text-sm font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
            disabled={isUpdating[removeItem?.id]}
            aria-label="Confirm remove test"
          >
            {isUpdating[removeItem?.id] && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveBookingItemDialog;