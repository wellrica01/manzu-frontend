import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, X, CheckCircle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DuplicateMedicationDialog = ({ 
  isOpen, 
  onClose, 
  existingItem, 
  newItem, 
  onKeepExisting, 
  onReplaceWithNew,
  onAddBoth 
}) => {
  const priceDiff = (newItem?.price || 0) - (existingItem?.price || 0);
  const savingsAmount = Math.abs(priceDiff);
  const newIsCheaper = priceDiff < 0;
  
  // Smart default: recommend the cheaper option
  const recommendedAction = newIsCheaper ? 'replace' : 'keep';
  const [selectedAction, setSelectedAction] = useState(recommendedAction);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = async () => {
    setIsProcessing(true);
    try {
      if (selectedAction === 'keep') {
        await onKeepExisting();
      } else if (selectedAction === 'replace') {
        await onReplaceWithNew();
      } else if (selectedAction === 'both') {
        await onAddBoth();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if data isn't ready
  if (!existingItem || !newItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-xl max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-orange-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-black mb-1 sm:mb-2">
                This item is already in your cart
              </DialogTitle>
              <p className="text-white/95 font-medium text-sm sm:text-base leading-relaxed">
                You already have this medication from <strong className="font-black">{existingItem.pharmacyName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Medication Info */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">
                  {existingItem.medicationName}
                </h3>
                <p className="text-sm text-gray-600 font-semibold">
                  Quantity: {existingItem.quantity}
                </p>
              </div>
            </div>
          </div>

          {/* Price Comparison */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-600 uppercase tracking-wide">
              Compare prices:
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Current Item */}
              <div className="relative">
                <div className="absolute -top-2 left-2 z-10">
                  <Badge className="bg-blue-500 text-white border-0 font-bold text-xs shadow-sm">
                    In Cart
                  </Badge>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 pt-6">
                  <p className="text-xs text-gray-600 font-semibold mb-1 truncate">
                    {existingItem.pharmacyName}
                  </p>
                  <p className="text-2xl font-black text-blue-600 mb-1">
                    ₦{existingItem.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    per unit
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-gray-600 font-semibold mb-0.5">Total</p>
                    <p className="text-sm font-black text-gray-900">
                      ₦{(existingItem.price * existingItem.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* New Item */}
              <div className="relative">
                {newIsCheaper && (
                  <div className="absolute -top-2 left-2 z-10">
                    <Badge className="bg-green-500 text-white border-0 font-bold text-xs shadow-sm">
                      💰 Cheaper
                    </Badge>
                  </div>
                )}
                <div className={`p-4 rounded-xl border-2 ${
                  newIsCheaper 
                    ? 'bg-green-50 border-green-300 pt-6' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-xs text-gray-600 font-semibold mb-1 truncate">
                    {newItem.pharmacyName}
                  </p>
                  <p className={`text-2xl font-black mb-1 ${
                    newIsCheaper ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    ₦{newItem.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    per unit
                  </p>
                  <div className={`mt-3 pt-3 border-t ${
                    newIsCheaper ? 'border-green-200' : 'border-gray-200'
                  }`}>
                    <p className="text-xs text-gray-600 font-semibold mb-0.5">Total</p>
                    <p className="text-sm font-black text-gray-900">
                      ₦{(newItem.price * newItem.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Difference */}
            {priceDiff !== 0 && (
              <div className={`p-3 rounded-lg ${
                newIsCheaper 
                  ? 'bg-green-100 border border-green-300' 
                  : 'bg-orange-100 border border-orange-300'
              }`}>
                <p className={`text-sm font-bold text-center ${
                  newIsCheaper ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {newIsCheaper 
                    ? `Save ₦${savingsAmount.toLocaleString()} with ${newItem.pharmacyName}`
                    : `${newItem.pharmacyName} is ₦${savingsAmount.toLocaleString()} more expensive`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Decision Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-gray-900">
              What would you like to do?
            </h3>

            {/* Option 1: Keep Current */}
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
                      Keep {existingItem.pharmacyName}
                    </p>
                    {!newIsCheaper && (
                      <Badge className="bg-blue-500 text-white border-0 font-bold text-xs shadow-sm">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Don't add this item. Keep your current selection at ₦{existingItem.price.toLocaleString()}/unit.
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2: Switch to New */}
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
                      Switch to {newItem.pharmacyName}
                    </p>
                    {newIsCheaper && (
                      <>
                        <Badge className="bg-green-500 text-white border-0 font-bold text-xs shadow-sm">
                          Save ₦{savingsAmount.toLocaleString()}
                        </Badge>
                        <Badge className="bg-blue-500 text-white border-0 font-bold text-xs shadow-sm">
                          Recommended
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Remove from {existingItem.pharmacyName} and get from {newItem.pharmacyName} instead at ₦{newItem.price.toLocaleString()}/unit.
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
                      <strong className="text-orange-600">You'll receive {existingItem.quantity + newItem.quantity} units total</strong> ({existingItem.quantity} from {existingItem.pharmacyName} + {newItem.quantity} from {newItem.pharmacyName}).
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
                  <div className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

export default DuplicateMedicationDialog;