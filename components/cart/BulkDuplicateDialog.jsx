import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShoppingCart, X } from 'lucide-react';

const BulkDuplicateDialog = ({ 
  isOpen, 
  onClose, 
  pharmacyName,
  duplicates = [],
  safeItemsCount = 0,
  onKeepExisting,
  onReplaceAll,
  onAddAll
}) => {
  const totalDuplicates = duplicates.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-2xl max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-orange-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-black mb-1 sm:mb-2">
                {totalDuplicates} Item{totalDuplicates > 1 ? 's' : ''} Already in Cart
              </DialogTitle>
              <p className="text-white/90 font-semibold text-sm sm:text-base">
                Some medications from <strong>{pharmacyName}</strong> are already in your cart from other pharmacies
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 sm:p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
              <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                Duplicates Found
              </p>
              <p className="text-2xl sm:text-3xl font-black text-orange-600">
                {totalDuplicates}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                New Items
              </p>
              <p className="text-2xl sm:text-3xl font-black text-green-600">
                {safeItemsCount}
              </p>
            </div>
          </div>

          {/* Duplicates List */}
          {duplicates.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                Duplicate Medications:
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {duplicates.map((dup, idx) => {
                  const priceDiff = dup.newPrice - dup.currentPrice;
                  const isNewCheaper = priceDiff < 0;
                  
                  return (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-bold text-gray-900 flex-1">
                          {dup.medicationName}
                        </p>
                        {isNewCheaper && (
                          <Badge className="bg-green-100 text-green-700 border border-green-300 font-black text-xs flex-shrink-0">
                            Save ₦{Math.abs(priceDiff).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <p className="text-gray-600 font-semibold mb-1">Current</p>
                          <p className="font-black text-blue-600">
                            ₦{dup.currentPrice.toLocaleString()}
                          </p>
                          <p className="text-gray-500 text-xs mt-1 truncate">
                            {dup.currentPharmacy}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg ${isNewCheaper ? 'bg-green-50' : 'bg-gray-100'}`}>
                          <p className="text-gray-600 font-semibold mb-1">{pharmacyName}</p>
                          <p className={`font-black ${isNewCheaper ? 'text-green-600' : 'text-gray-600'}`}>
                            ₦{dup.newPrice.toLocaleString()}
                          </p>
                          <p className={`text-xs mt-1 ${isNewCheaper ? 'text-green-600' : 'text-gray-500'}`}>
                            {isNewCheaper ? '✓ Cheaper' : priceDiff > 0 ? '↑ More expensive' : 'Same price'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Safe Items Info */}
          {safeItemsCount > 0 && (
            <div className="p-3 sm:p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <p className="text-sm font-bold text-green-700 text-center">
                ✓ {safeItemsCount} item{safeItemsCount > 1 ? 's' : ''} can be added without conflicts
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3 pt-2">
            {/* Add Only New Items */}
            {safeItemsCount > 0 && (
              <Button
                onClick={onKeepExisting}
                className="w-full h-12 sm:h-14 rounded-xl font-black text-sm sm:text-base bg-gradient-to-r from-green-500 to-green-600 text-white hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" strokeWidth={3} />
                <span className="truncate">
                  Add Only {safeItemsCount} New Item{safeItemsCount > 1 ? 's' : ''} (Keep Current)
                </span>
              </Button>
            )}

            {/* Replace All */}
            <Button
              onClick={onReplaceAll}
              className="w-full h-12 sm:h-14 rounded-xl font-black text-sm sm:text-base bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" strokeWidth={3} />
              <span className="truncate">
                Switch to {pharmacyName} (Replace {totalDuplicates})
              </span>
            </Button>

            {/* Add From Both */}
            <Button
              onClick={onAddAll}
              variant="outline"
              className="w-full h-10 sm:h-12 rounded-xl font-bold text-xs sm:text-sm border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 text-gray-600"
            >
              Add All (Buy from Different Pharmacies)
            </Button>

            {/* Cancel */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full h-9 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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