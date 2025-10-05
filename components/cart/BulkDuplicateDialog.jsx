import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShoppingCart, X, Loader2, AlertCircle, CheckCircle, Package } from 'lucide-react';

const BulkDuplicateDialog = ({ 
  isOpen, 
  onClose, 
  pharmacyName,
  duplicates = [],
  safeItemsCount = 0,
  onKeepExisting,
  onReplaceAll,
  onAddAll,
  isProcessing = false
}) => {
  const totalDuplicates = duplicates.length;
  
  // Calculate total savings if user switches
  const totalSavings = useMemo(() => {
    return duplicates.reduce((sum, dup) => {
      const diff = dup.currentPrice - dup.newPrice;
      return sum + diff;
    }, 0);
  }, [duplicates]);

  // Smart default: recommend replace if new pharmacy is cheaper overall
  const recommendedAction = totalSavings > 0 ? 'replace' : 'skip';
  const [selectedAction, setSelectedAction] = useState(recommendedAction);

  const handleContinue = () => {
    if (selectedAction === 'skip') {
      onKeepExisting();
    } else if (selectedAction === 'replace') {
      onReplaceAll();
    } else if (selectedAction === 'both') {
      onAddAll();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-2xl max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-orange-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-black mb-1 sm:mb-2">
                Hold on! Some items are already in your cart
              </DialogTitle>
              <p className="text-white/95 font-medium text-sm sm:text-base leading-relaxed">
                You're adding from <strong className="font-black">{pharmacyName}</strong>, but you already have {totalDuplicates} item{totalDuplicates > 1 ? 's' : ''} from other pharmacies
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Duplicates List */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items already in your cart:
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {duplicates.map((dup, idx) => {
                const priceDiff = dup.currentPrice - dup.newPrice;
                const isCheaper = priceDiff > 0;
                const isMoreExpensive = priceDiff < 0;
                
                return (
                  <div key={idx} className="p-3 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-gray-900 flex-1 leading-tight">
                        {dup.medicationName}
                      </p>
                      {isCheaper && (
                        <Badge className="bg-green-500 text-white border-0 font-black text-xs flex-shrink-0 shadow-sm">
                          Save ₦{Math.abs(priceDiff).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex-1">
                        <p className="text-gray-500 font-semibold mb-0.5">Current</p>
                        <p className="font-black text-gray-900">
                          ₦{dup.currentPrice.toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">
                          {dup.currentPharmacy}
                        </p>
                      </div>
                      <div className="text-gray-300 font-bold">→</div>
                      <div className="flex-1">
                        <p className="text-gray-500 font-semibold mb-0.5">{pharmacyName}</p>
                        <p className={`font-black ${isCheaper ? 'text-green-600' : isMoreExpensive ? 'text-orange-600' : 'text-gray-900'}`}>
                          ₦{dup.newPrice.toLocaleString()}
                        </p>
                        <p className={`text-xs mt-0.5 font-semibold ${isCheaper ? 'text-green-600' : isMoreExpensive ? 'text-orange-600' : 'text-gray-400'}`}>
                          {isCheaper ? '✓ Cheaper' : isMoreExpensive ? '↑ More expensive' : 'Same price'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decision Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-gray-900">
              What would you like to do?
            </h3>

            {/* Option 1: Skip Duplicates */}
            {safeItemsCount > 0 && (
              <button
                onClick={() => setSelectedAction('skip')}
                disabled={isProcessing}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedAction === 'skip'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedAction === 'skip' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {selectedAction === 'skip' && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 mb-1">
                      Skip duplicates, add only the {safeItemsCount} new item{safeItemsCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Your cart stays the same for these medications. Only items you don't have yet will be added.
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Option 2: Replace */}
            <button
              onClick={() => setSelectedAction('replace')}
              disabled={isProcessing}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedAction === 'replace'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAction === 'replace' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {selectedAction === 'replace' && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-gray-900">
                      Switch to {pharmacyName} for these items
                    </p>
                    {totalSavings > 0 && (
                      <Badge className="bg-green-500 text-white border-0 font-black text-xs shadow-sm">
                        Save ₦{totalSavings.toLocaleString()}
                      </Badge>
                    )}
                    {recommendedAction === 'replace' && (
                      <Badge className="bg-blue-500 text-white border-0 font-bold text-xs shadow-sm">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Remove the {totalDuplicates} duplicate item{totalDuplicates > 1 ? 's' : ''} from your current cart and replace with {pharmacyName}'s versions{safeItemsCount > 0 ? `, plus add ${safeItemsCount} new item${safeItemsCount > 1 ? 's' : ''}` : ''}.
                  </p>
                </div>
              </div>
            </button>

            {/* Option 3: Buy from Both */}
            <button
              onClick={() => setSelectedAction('both')}
              disabled={isProcessing}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedAction === 'both'
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAction === 'both' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                }`}>
                  {selectedAction === 'both' && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 mb-1">
                    Buy from both pharmacies
                  </p>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong className="text-orange-600">You'll receive 2× quantities</strong> for duplicate items (useful for stocking up or backup supply).
                    </p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-gray-200">
            <Button
              onClick={handleContinue}
              disabled={isProcessing}
              className="w-full h-12 sm:h-14 rounded-xl font-black text-sm sm:text-base bg-gradient-to-r from-green-500 to-green-600 text-white hover:scale-[1.02] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" strokeWidth={2.5} />
                  Continue
                </>
              )}
            </Button>

            <Button
              onClick={onClose}
              disabled={isProcessing}
              variant="ghost"
              className="w-full h-10 rounded-xl font-semibold text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2" strokeWidth={2.5} />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDuplicateDialog;