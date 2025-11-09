import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  AlertCircle,
  X,
  Package,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UnifiedRemoveDialog({ 
  removeItem,
  bulkRemoveItems,
  onClose, 
  onConfirm, 
  isRemoving 
}) {
  const [pulseParticles, setPulseParticles] = useState([]);
  const isBulkRemove = bulkRemoveItems && bulkRemoveItems.length > 0;
  const isOpen = !!removeItem || isBulkRemove;
  const itemCount = isBulkRemove ? bulkRemoveItems.length : 1;
  const items = isBulkRemove ? bulkRemoveItems : removeItem ? [removeItem] : [];

  // Generate pulse particles for dramatic effect
  useEffect(() => {
    if (isOpen) {
      const particles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (i * 360) / 8,
        delay: i * 100,
      }));
      setPulseParticles(particles);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
  <Dialog open={isOpen} onOpenChange={isRemoving ? undefined : onClose}>
  <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-0 shadow-2xl">
    <VisuallyHidden>
      <DialogTitle>
        {isBulkRemove ? 'Bulk Remove Confirmation' : 'Remove Item Confirmation'}
      </DialogTitle>
    </VisuallyHidden>

    {/* Dramatic Header */}
    <div className="relative bg-gradient-to-br from-rose-500 via-red-500 to-orange-600 p-6 sm:p-8 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        {pulseParticles.map(particle => (
          <div
            key={particle.id}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/30"
            style={{
              transform: `translate(-50%, -50%) rotate(${particle.angle}deg) translateX(0)`,
              animation: `pulse-out 2s ease-out ${particle.delay}ms infinite`,
            }}
          />
        ))}
      </div>

      {/* Alert Icon */}
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-5">
        <div className="relative animate-in zoom-in-50 duration-500">
          <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />

          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl border-4 border-white/40 shadow-2xl">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-2xl animate-pulse" strokeWidth={3} />
          </div>

          <div className="absolute -bottom-1 -right-1 p-2 sm:p-2.5 rounded-full bg-orange-500 border-4 border-white/40 shadow-xl animate-bounce">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" strokeWidth={3} />
          </div>
        </div>

        <div className="text-center space-y-1 sm:space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Remove {itemCount === 1 ? 'Item' : 'Items'}?
          </h3>
          <p className="text-white/90 font-semibold text-sm sm:text-base">
            {itemCount === 1
              ? 'This action will remove this item from your cart'
              : `This action will remove ${itemCount} items from your cart`
            }
          </p>

          {itemCount > 1 && (
            <Badge className="bg-white/20 text-white font-black text-base sm:text-lg px-3 sm:px-4 py-1 sm:py-2 shadow-lg backdrop-blur-sm border-2 border-white/30 animate-in zoom-in-95">
              {itemCount} items
            </Badge>
          )}
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-gradient-to-b from-gray-50 to-white">
      {/* Items */}
      <div className="space-y-2 sm:space-y-3">
        <h3 className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-black text-gray-700 uppercase tracking-wider">
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" strokeWidth={2.5} />
          {itemCount === 1 ? 'Item to remove:' : `${itemCount} items to remove:`}
        </h3>

        {itemCount === 1 ? (
          <div className="relative p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border-2 border-red-200 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-xl" />
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg shadow-sm flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-lg font-black text-gray-900 mb-1 leading-tight">{items[0].name}</p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">Quantity:</span>
                  <Badge className="bg-red-100 text-red-700 font-black text-xs sm:text-sm px-2 py-0.5">×{items[0].quantity}</Badge>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="p-1.5 sm:p-2 rounded-full bg-red-100">
                  <X className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-60 sm:max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-gray-100">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-red-100 hover:border-red-300 hover:shadow-md transition-all duration-300">
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 flex-shrink-0">
                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mb-1">{item.name}</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs text-gray-600 font-semibold">Qty:</span>
                    <Badge className="bg-red-100 text-red-700 font-black text-xs sm:text-sm px-2 py-0.5">×{item.quantity}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="relative flex-shrink-0">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 animate-pulse" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-orange-600/20 rounded-full blur-md animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-bold text-orange-900 mb-1">Permanent Removal</p>
            <p className="text-[10px] sm:text-xs text-orange-700 font-medium leading-relaxed">
              {itemCount === 1
                ? 'This item will be completely removed from your cart. You can add it back later if needed.'
                : `All ${itemCount} items will be completely removed from your cart. You can add them back later if needed.`}
            </p>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <div className="flex items-center gap-1 sm:gap-2">
          <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" strokeWidth={2.5} />
          <p className="text-[10px] sm:text-xs text-blue-700 font-semibold">
            <span className="font-black">Tip:</span> You can always search and re-add items from our catalog
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isRemoving}
          className="flex-1 h-12 sm:h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
          Cancel
        </Button>

        <Button
          onClick={onConfirm}
          disabled={isRemoving}
          className="relative flex-1 h-12 sm:h-14 rounded-2xl font-bold transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden group flex items-center justify-center gap-2"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-600 to-orange-600" />
          <span className="relative z-10 text-white flex items-center justify-center gap-2">
            {isRemoving ? (
              <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                Remove {itemCount > 1 && `(${itemCount})`}
              </>
            )}
          </span>
        </Button>
      </div>
    </div>
  </DialogContent>

  <style jsx>{`
    @keyframes pulse-out {
      0% {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0);
        opacity: 0.6;
      }
      100% {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(60px);
        opacity: 0;
      }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `}</style>
</Dialog>

  );
}