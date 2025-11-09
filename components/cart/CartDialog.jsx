import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Package,
  PartyPopper,
  Zap,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const CartDialog = ({ 
  openCartDialog, 
  setOpenCartDialog, 
  lastAddedItems,
  onRemoveItems,
  isRemoving = false
}) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState([]);
  
  const items = Array.isArray(lastAddedItems)
    ? lastAddedItems
    : lastAddedItems
    ? [lastAddedItems]
    : [];

  const isSingleItem = items.length === 1;

  // Success animation trigger
  useEffect(() => {
    if (openCartDialog && !showRemoveConfirm) {
      setIsAnimating(true);
      
      // Generate confetti particles
      const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 500,
        duration: 1000 + Math.random() * 1000,
      }));
      setConfettiParticles(particles);

      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [openCartDialog, showRemoveConfirm]);

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

  // Success view - Premium design
  if (!showRemoveConfirm) {
    return (
<Dialog open={openCartDialog} onOpenChange={setOpenCartDialog}>
  <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-0 shadow-2xl">
    <VisuallyHidden>
      <DialogTitle>Items Added to Cart</DialogTitle>
    </VisuallyHidden>

    {/* Premium Header */}
    <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 sm:p-8 text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      {/* Confetti */}
      {isAnimating && confettiParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347'][Math.floor(Math.random() * 4)],
            animation: `fall ${particle.duration}ms ease-in forwards`,
            animationDelay: `${particle.delay}ms`,
          }}
        />
      ))}

      {/* Success Icon */}
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-5">
        <div className="relative animate-in zoom-in-50 duration-500">
          <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
          
          <div className="relative w-20 sm:w-24 h-20 sm:h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl border-4 border-white/40 shadow-2xl">
            <CheckCircle className="h-10 sm:h-12 w-10 sm:w-12 text-white drop-shadow-lg" strokeWidth={3} />
          </div>

          <Sparkles className="absolute -top-2 -right-2 h-6 sm:h-8 w-6 sm:w-8 text-yellow-300 animate-pulse drop-shadow-lg" strokeWidth={2.5} />
          <PartyPopper className="absolute -bottom-2 -left-2 h-6 sm:h-8 w-6 sm:w-8 text-pink-300 animate-bounce drop-shadow-lg" strokeWidth={2.5} />
        </div>

        <div className="text-center space-y-1 sm:space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Added to Cart!
          </h3>
          <p className="text-white/90 font-semibold text-sm sm:text-base">
            {isSingleItem ? 'Item is' : `${items.length} items are`} ready for checkout
          </p>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-gradient-to-b from-gray-50 to-white">
      {/* Items Display */}
      {isSingleItem ? (
        <div className="relative p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border-2 border-emerald-200 shadow-md hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-t-xl" />
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl shadow-sm flex-shrink-0">
              <Pill className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-lg font-black text-gray-900 mb-1 sm:mb-2">{items[0].name}</p>
              <div className="flex items-center gap-1 sm:gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm px-2 py-0.5">×{items[0].quantity}</Badge>
                <span className="text-xs sm:text-sm text-gray-500">•</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">
                  from <span className="text-emerald-600">{items[0].pharmacy}</span>
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="p-1.5 sm:p-2 rounded-full bg-emerald-100">
                <CheckCircle className="h-4 sm:h-6 w-4 sm:w-6 text-emerald-600" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Summary Card */}
          <div className="relative p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border-2 border-emerald-200 shadow-md animate-in fade-in slide-in-from-bottom-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-t-xl" />
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl shadow-sm">
                <Package className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-lg sm:text-xl font-black text-gray-900 mb-1">{items.length} medications added</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-600">
                  from <span className="text-emerald-600">{items[0]?.pharmacy}</span>
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2 shadow-lg">
                {items.length}
              </Badge>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-1 max-h-56 sm:max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-gray-100">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all duration-300 animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${400 + index * 80}ms` }}
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100">
                  <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{item.name}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm px-2 py-0.5">×{item.quantity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Hint */}
      <div className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-start gap-2 sm:gap-3">
          <Zap className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 flex-shrink-0 animate-pulse mt-0.5" strokeWidth={2.5} />
          <p className="text-xs sm:text-sm text-blue-700 font-semibold leading-relaxed">
            <span className="font-black">Ready to checkout?</span> View your cart to complete your order and get your medications delivered!
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 sm:space-y-3">
        <Button asChild className="relative w-full h-14 sm:h-16 rounded-2xl font-black text-base overflow-hidden group transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl animate-in fade-in zoom-in-95">
          <Link href="/cart">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
            <span className="relative z-10 flex items-center justify-center gap-2 text-white">
              <ShoppingCart className="h-5 sm:h-6 w-5 sm:w-6 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
              View Cart & Checkout
              <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
            </span>
          </Link>
        </Button>

        <Button
          variant="outline"
          onClick={() => setOpenCartDialog(false)}
          className="w-full h-12 sm:h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 group animate-in fade-in zoom-in-95"
        >
          <ShoppingBag className="h-4 sm:h-5 w-4 sm:w-5 mr-2 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
          Continue Shopping
        </Button>

        <Button
          variant="ghost"
          onClick={() => setShowRemoveConfirm(true)}
          className="w-full h-12 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 group animate-in fade-in"
        >
          <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
          Remove from Cart
        </Button>
      </div>
    </div>

    <style jsx>{`
      @keyframes fall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </DialogContent>
</Dialog>

    );
  }

  // Remove confirmation view - Dramatic warning design
  return (
<Dialog
  open={openCartDialog}
  onOpenChange={() => {
    setOpenCartDialog(false);
    setShowRemoveConfirm(false);
  }}
>
  <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-0 shadow-2xl">
    <VisuallyHidden>
      <DialogTitle>Remove Items Confirmation</DialogTitle>
    </VisuallyHidden>

    {/* Warning Header */}
    <div className="relative bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 p-6 sm:p-8 text-white overflow-hidden">
      {/* Pulsing Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      {/* Icon */}
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-5">
        <div className="relative animate-in zoom-in-50 duration-500">
          <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
          <div className="relative w-20 sm:w-24 h-20 sm:h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl border-4 border-white/40 shadow-2xl">
            <AlertCircle className="h-10 sm:h-12 w-10 sm:w-12 text-white drop-shadow-lg animate-pulse" strokeWidth={3} />
          </div>
        </div>

        <div className="text-center space-y-1 sm:space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Remove {isSingleItem ? 'Item' : 'Items'}?
          </h3>
          <p className="text-white/90 font-semibold text-sm sm:text-base">
            This will remove {isSingleItem ? 'this item' : `${items.length} items`} from your cart
          </p>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-gradient-to-b from-gray-50 to-white">
      {/* Items */}
      <div className="space-y-2 sm:space-y-3">
        <h3 className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-black text-gray-700 uppercase tracking-wider">
          <Trash2 className="h-3 sm:h-4 w-3 sm:w-4 text-red-500" strokeWidth={2.5} />
          {isSingleItem ? 'Item to remove:' : 'Items to remove:'}
        </h3>

        {isSingleItem ? (
          <div className="relative p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border-2 border-red-200 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-xl" />
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg shadow-sm flex-shrink-0">
                <Pill className="h-5 sm:h-6 w-5 sm:w-6 text-red-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-lg font-black text-gray-900 mb-1">{items[0].name}</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-600">
                  from <span className="text-red-600">{items[0].pharmacy}</span>
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-1.5 sm:p-2 rounded-full bg-red-100">
                  <X className="h-4 sm:h-6 w-4 sm:w-6 text-red-600" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-60 sm:max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-gray-100">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-red-100 hover:border-red-300 hover:shadow-md transition-all duration-300">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <X className="h-3 sm:h-4 w-3 sm:w-4 text-red-600" strokeWidth={2.5} />
                </div>
                <p className="text-sm sm:text-base font-bold text-gray-800 flex-1 truncate">{item.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '600ms' }}>
        <div className="flex items-start gap-2 sm:gap-3">
          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600 flex-shrink-0 mt-0.5 animate-pulse" strokeWidth={2.5} style={{ animationDuration: '2s' }} />
          <p className="text-sm sm:text-base text-orange-700 font-semibold leading-relaxed">
            {isSingleItem
              ? 'This item will be completely removed from your cart. You can add it back later if needed.'
              : 'These items will be completely removed from your cart. You can add them back later if needed.'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 animate-in fade-in zoom-in-95" style={{ animationDelay: '700ms' }}>
        <Button
          variant="outline"
          onClick={() => setShowRemoveConfirm(false)}
          disabled={isRemoving}
          className="flex-1 h-12 sm:h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <X className="h-4 sm:h-5 w-4 sm:w-5" strokeWidth={2.5} />
          Cancel
        </Button>

        <Button
          onClick={handleRemove}
          disabled={isRemoving}
          className="relative flex-1 h-12 sm:h-14 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden group flex items-center justify-center gap-2"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-600 to-orange-600" />
          {!isRemoving && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2 text-white">
            {isRemoving ? (
              <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 sm:h-5 w-4 sm:w-5" strokeWidth={2.5} />
                Remove {!isSingleItem && `(${items.length})`}
              </>
            )}
          </span>
        </Button>
      </div>
       </div>
    </DialogContent>

    <style jsx>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </Dialog>
  );
};

export default CartDialog;