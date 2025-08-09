import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, CheckCircle } from 'lucide-react';

const QuantityUpdateDialog = ({ quantityUpdate, setQuantityUpdate }) => {
  if (!quantityUpdate) return null;

  return (
    <Dialog open={!!quantityUpdate} onOpenChange={() => setQuantityUpdate(null)}>
      <DialogContent className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl">
        <div className="p-3 mt-6 mb-2 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-[#1ABA7F]">{quantityUpdate.name}</span> has been updated with the new quantity (<span className="font-semibold text-[#1ABA7F]">{quantityUpdate.quantity}</span>).
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setQuantityUpdate(null)}
            className="w-full h-12 sm:w-auto border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityUpdateDialog;