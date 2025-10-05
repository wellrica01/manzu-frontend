import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShoppingCart, X, Loader2, AlertCircle, CheckCircle, Package } from 'lucide-react';

const BulkDuplicateDialog = ({ 
  isOpen, 
  onClose, 
  pharmacyName = 'this pharmacy',
  duplicates = [],
  safeItems = [],
  medications = [],
  safeItemsCount = 0,
  onKeepExisting,
  onReplaceAll,
  onAddAll,
  isProcessing = false
}) => {
  const totalDuplicates = duplicates.length;
  const totalItemsCount = totalDuplicates + safeItemsCount
  
  // Calculate total savings if user switches
  const totalSavings = useMemo(() => {
    return duplicates.reduce((sum, dup) => {
      const diff = dup.currentPrice - dup.newPrice;
      return sum + diff;
    }, 0);
  }, [duplicates]);

  // Smart default: recommend replace if new pharmacy is cheaper overall
  const recommendedAction = totalSavings > 0 ? 'replace' : 'skip';
  const [selectedAction, setSelectedAction] = useState(
    safeItemsCount === 0 && totalSavings <= 0 ? 'keep' : recommendedAction
  );

const handleContinue = () => {
  if (isProcessing) return; // Prevent double-clicks
  
  if (selectedAction === 'keep') {
    if (safeItemsCount > 0) {
      onKeepExisting();
    } else {
      onClose();
    }
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
            {safeItemsCount === 0 && totalDuplicates > 0 
              ? "These items are already in your cart" 
              : "Hold on! Some items are already in your cart"
            }
          </DialogTitle>
          <p className="text-white/95 font-medium text-sm sm:text-base leading-relaxed">
            {safeItemsCount === 0 && totalDuplicates > 0 ? (
              <>
                All {totalDuplicates} item{totalDuplicates > 1 ? 's' : ''} from <strong className="font-black">{pharmacyName}</strong> {totalDuplicates > 1 ? 'are' : 'is'} already in your cart from {totalDuplicates === 1 ? duplicates[0].currentPharmacy : 'other pharmacies'}
              </>
            ) : (
              <>
                You're adding {totalItemsCount} items from <strong className="font-black">{pharmacyName}</strong>, but you already have {totalDuplicates} item{totalDuplicates > 1 ? 's' : ''} from {totalDuplicates === 1 ? duplicates[0].currentPharmacy : 'other pharmacies'}
              </>
            )}
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
        {/* Safe Items List - New additions */}
        {safeItemsCount > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              New items to be added ({safeItemsCount}):
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {safeItems.map((item, idx) => {
                const qty = medications?.find(m => m.id === item.id)?.quantity || 1;
                
                return (
                  <div key={idx} className="p-3 bg-gradient-to-r from-green-50 to-green-50/50 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-gray-900 flex-1 leading-tight">
                        {item.displayName || 'Unknown Medication'}
                      </p>
                      <Badge className="bg-green-500 text-white border-0 font-black text-xs flex-shrink-0 shadow-sm">
                        ✓ New
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex-1">
                        <p className="text-gray-500 font-semibold mb-0.5">{pharmacyName}</p>
                        <p className="font-black text-green-600">
                          ₦{(item.price || 0).toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          Qty: {qty}
                        </p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-gray-500 font-semibold mb-0.5">Total</p>
                        <p className="font-black text-gray-900">
                          ₦{((item.price || 0) * qty).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-center text-blue-700 font-semibold">
                💡 {safeItemsCount > 1 ? 'These items will' : 'This item will'} be added to your cart with any option you choose
              </p>
            </div>
          </div>
        )}
          {/* Decision Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-gray-900">
              What would you like to do?
            </h3>

          {/* Option 1: Skip Duplicates */}
          <button
            onClick={() => setSelectedAction('keep')}
            disabled={isProcessing}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selectedAction === 'keep'
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedAction === 'keep' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedAction === 'keep' && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-gray-900">
                    {safeItemsCount > 0 
                      ? `Keep existing, add only new items`
                      : 'Keep my existing selection'
                    }
                  </p>
                  {safeItemsCount === 0 && totalSavings <= 0 && (
                    <Badge className="bg-blue-500 text-white border-0 font-bold text-xs shadow-sm">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {(() => {
                    if (!duplicates || duplicates.length === 0) {
                      return (
                        <>
                          Keep your current cart as is. Nothing will be added from{" "}
                          <strong>{pharmacyName || "this pharmacy"}</strong>.
                        </>
                      );
                    }

                    // Build safe items description
                    let safeItemsDesc = "";
                    if (safeItemsCount > 0) {
                      if (safeItemsCount === 1) {
                        safeItemsDesc = (
                          <>
                            {" "}
                            Add only new item:{" "}
                            <strong>{safeItems[0]?.displayName || "medication"}</strong> from{" "}
                            <strong>{pharmacyName || "this pharmacy"}</strong>.
                          </>
                        );
                      } else if (safeItemsCount === 2) {
                        safeItemsDesc = (
                          <>
                            {" "}
                            Add only new items:{" "}
                            <strong>{safeItems[0]?.displayName || "item"}</strong> and{" "}
                            <strong>{safeItems[1]?.displayName || "item"}</strong> from{" "}
                            <strong>{pharmacyName || "this pharmacy"}</strong>.
                          </>
                        );
                      } else {
                        const names = safeItems
                          .slice(0, 2)
                          .map((s) => s?.displayName)
                          .filter(Boolean)
                          .join(", ");
                        const remaining = safeItemsCount - 2;
                        safeItemsDesc = (
                          <>
                            {" "}
                            Add only new items: <strong>{names}</strong>, and{" "}
                            <strong>
                              {remaining} other{remaining > 1 ? "s" : ""}
                            </strong>{" "}
                            from <strong>{pharmacyName || "this pharmacy"}</strong>.
                          </>
                        );
                      }
                    }

                    if (totalDuplicates === 1) {
                      const dup = duplicates[0];
                      const keepMsg = (
                        <>
                          Keep <strong>{dup?.medicationName || "your item"}</strong> from{" "}
                          <strong>{dup?.currentPharmacy || "your current pharmacy"}</strong>.
                        </>
                      );
                      return (
                        <>
                          {keepMsg}
                          {safeItemsCount > 0 ? safeItemsDesc : " Nothing else will be added."}
                        </>
                      );
                    } else if (totalDuplicates === 2) {
                      const item1 = `${duplicates[0]?.medicationName || "item"} from ${
                        duplicates[0]?.currentPharmacy || "pharmacy"
                      }`;
                      const item2 = `${duplicates[1]?.medicationName || "item"} from ${
                        duplicates[1]?.currentPharmacy || "pharmacy"
                      }`;
                      const keepMsg = (
                        <>
                          Keep <strong>{item1}</strong> and <strong>{item2}</strong>.
                        </>
                      );
                      return (
                        <>
                          {keepMsg}
                          {safeItemsCount > 0 ? safeItemsDesc : " Nothing else will be added."}
                        </>
                      );
                    } else {
                      const item1 = `${duplicates[0]?.medicationName || "item"} from ${
                        duplicates[0]?.currentPharmacy || "pharmacy"
                      }`;
                      const item2 = `${duplicates[1]?.medicationName || "item"} from ${
                        duplicates[1]?.currentPharmacy || "pharmacy"
                      }`;
                      const remaining = totalDuplicates - 2;
                      const keepMsg = (
                        <>
                          Keep <strong>{item1}</strong>, <strong>{item2}</strong>, and{" "}
                          <strong>
                            {remaining} other{remaining > 1 ? "s" : ""}
                          </strong>
                          .
                        </>
                      );
                      return (
                        <>
                          {keepMsg}
                          {safeItemsCount > 0 ? safeItemsDesc : " Nothing else will be added."}
                        </>
                      );
                    }
                  })()}
                </p>

              </div>
            </div>
          </button>

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
                  {(() => {
                    if (!duplicates || duplicates.length === 0) {
                      return (
                        <>
                          Replace items with versions from{" "}
                          <strong>{pharmacyName || "this pharmacy"}</strong>.
                        </>
                      );
                    }

                    // Build safe items description
                    let safeItemsDesc = "";
                    if (safeItemsCount > 0) {
                      if (safeItemsCount === 1) {
                        safeItemsDesc = (
                          <>
                            {" "}
                            Also add new: <strong>{safeItems[0]?.displayName || "medication"}</strong>.
                          </>
                        );
                      } else if (safeItemsCount === 2) {
                        safeItemsDesc = (
                          <>
                            {" "}
                            Also add new:{" "}
                            <strong>{safeItems[0]?.displayName || "item"}</strong> and{" "}
                            <strong>{safeItems[1]?.displayName || "item"}</strong>.
                          </>
                        );
                      } else {
                        const names = safeItems
                          .slice(0, 2)
                          .map((s) => s?.displayName)
                          .filter(Boolean)
                          .join(", ");
                        const remaining = safeItemsCount - 2;
                        safeItemsDesc = (
                          <>
                            {" "}
                            Also add new: <strong>{names}</strong>, and{" "}
                            <strong>
                              {remaining} other{remaining > 1 ? "s" : ""}
                            </strong>
                            .
                          </>
                        );
                      }
                    }

                    if (totalDuplicates === 1) {
                      const dup = duplicates[0];
                      const replaceMsg = (
                        <>
                          Remove <strong>{dup?.medicationName || "item"}</strong> from{" "}
                          <strong>{dup?.currentPharmacy || "your pharmacy"}</strong>, get it from{" "}
                          <strong>{pharmacyName || "this pharmacy"}</strong> at ₦
                          <strong>{(dup?.newPrice || 0).toLocaleString()}</strong>
                        </>
                      );
                      return (
                        <>
                          {replaceMsg}.{safeItemsDesc}
                        </>
                      );
                    } else if (totalDuplicates === 2) {
                      const item1 = `${duplicates[0]?.medicationName || "item"} from ${
                        duplicates[0]?.currentPharmacy || "pharmacy"
                      }`;
                      const item2 = `${duplicates[1]?.medicationName || "item"} from ${
                        duplicates[1]?.currentPharmacy || "pharmacy"
                      }`;
                      const replaceMsg = (
                        <>
                          Remove <strong>{item1}</strong> and <strong>{item2}</strong>, get both from{" "}
                          <strong>{pharmacyName || "this pharmacy"}</strong>
                        </>
                      );
                      return (
                        <>
                          {replaceMsg}.{safeItemsDesc}
                        </>
                      );
                    } else {
                      const item1 = `${duplicates[0]?.medicationName || "item"} from ${
                        duplicates[0]?.currentPharmacy || "pharmacy"
                      }`;
                      const item2 = `${duplicates[1]?.medicationName || "item"} from ${
                        duplicates[1]?.currentPharmacy || "pharmacy"
                      }`;
                      const remaining = totalDuplicates - 2;
                      const replaceMsg = (
                        <>
                          Remove <strong>{item1}</strong>, <strong>{item2}</strong>, and{" "}
                          <strong>
                            {remaining} other{remaining > 1 ? "s" : ""}
                          </strong>
                          , get all from <strong>{pharmacyName || "this pharmacy"}</strong>
                        </>
                      );
                      return (
                        <>
                          {replaceMsg}.{safeItemsDesc}
                        </>
                      );
                    }
                  })()}
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
                {(() => {
                  if (!duplicates || duplicates.length === 0) {
                    return (
                      <>
                        Add items from <strong>{pharmacyName || "this pharmacy"}</strong>.
                      </>
                    );
                  }

                  // Build safe items description
                  let safeItemsDesc = "";
                  if (safeItemsCount > 0) {
                    if (safeItemsCount === 1) {
                      safeItemsDesc = (
                        <>
                          {" "}
                          Plus new: <strong>{safeItems[0]?.displayName || "medication"}</strong>.
                        </>
                      );
                    } else if (safeItemsCount === 2) {
                      safeItemsDesc = (
                        <>
                          {" "}
                          Plus new:{" "}
                          <strong>{safeItems[0]?.displayName || "item"}</strong> and{" "}
                          <strong>{safeItems[1]?.displayName || "item"}</strong>.
                        </>
                      );
                    } else {
                      const names = safeItems
                        .slice(0, 2)
                        .map((s) => s?.displayName)
                        .filter(Boolean)
                        .join(", ");
                      const remaining = safeItemsCount - 2;
                      safeItemsDesc = (
                        <>
                          {" "}
                          Plus new: <strong>{names}</strong>, and{" "}
                          <strong>
                            {remaining} other{remaining > 1 ? "s" : ""}
                          </strong>
                          .
                        </>
                      );
                    }
                  }

                  if (totalDuplicates === 1) {
                    const dup = duplicates[0];
                    const doubleMsg = (
                      <>
                        You'll get double{" "}
                        <strong>{dup?.medicationName || "this item"}</strong> (from{" "}
                        <strong>{dup?.currentPharmacy || "your pharmacy"}</strong> and{" "}
                        <strong>{pharmacyName || "this pharmacy"}</strong>)
                      </>
                    );
                    return (
                      <>
                        <strong className="text-orange-600">Double quantity:</strong>{" "}
                        {doubleMsg}.{safeItemsDesc} Good for stocking up.
                      </>
                    );
                  } else if (totalDuplicates === 2) {
                    const meds = duplicates
                      .map((d) => d?.medicationName)
                      .filter(Boolean)
                      .join(" and ");
                    return (
                      <>
                        <strong className="text-orange-600">Double quantities:</strong> You'll
                        get double <strong>{meds}</strong> (from your current pharmacies and{" "}
                        <strong>{pharmacyName || "this pharmacy"}</strong>).{safeItemsDesc}{" "}
                      </>
                    );
                  } else {
                    const med1 = duplicates[0]?.medicationName || "item";
                    const med2 = duplicates[1]?.medicationName || "item";
                    const remaining = totalDuplicates - 2;
                    const doubleMsg = (
                      <>
                        You'll get double <strong>{med1}</strong>, <strong>{med2}</strong>, and{" "}
                        <strong>
                          {remaining} other{remaining > 1 ? "s" : ""}
                        </strong>{" "}
                        (from your current pharmacies and{" "}
                        <strong>{pharmacyName || "this pharmacy"}</strong>)
                      </>
                    );
                    return (
                      <>
                        <strong className="text-orange-600">Double quantities:</strong>{" "}
                        {doubleMsg}.{safeItemsDesc}
                      </>
                    );
                  }
                })()}
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