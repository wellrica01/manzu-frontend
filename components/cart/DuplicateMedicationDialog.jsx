"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReplace = async () => {
    setIsProcessing(true);
    await onReplaceWithNew();
    setIsProcessing(false);
  };

  const handleKeep = async () => {
    setIsProcessing(true);
    await onKeepExisting();
    setIsProcessing(false);
  };

  const handleAddBoth = async () => {
    setIsProcessing(true);
    await onAddBoth();
    setIsProcessing(false);
  };

  const priceDiff = (newItem?.price || 0) - (existingItem?.price || 0);
  const savingsAmount = Math.abs(priceDiff);
  const newIsCheaper = priceDiff < 0;

  // Don't render if data isn't ready
  if (!existingItem || !newItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-2xl max-h-[90vh] mx-auto p-0 overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-orange-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-black mb-1 sm:mb-2">
                Medication Already in Cart
              </DialogTitle>
              <DialogDescription className="text-white/90 font-semibold text-sm sm:text-base">
                You already have this medication from another pharmacy. What would you like to do?
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
          {/* Medication Name */}
          <div className="text-center pb-3 sm:pb-4 border-b-2 border-gray-100">
            <h3 className="text-lg sm:text-xl font-black text-gray-900">
              {existingItem.medicationName}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-semibold mt-1">
              Quantity: {existingItem.quantity}
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-hidden">
            {/* Existing Item */}
            <div className="relative min-w-0 pt-3">
              <Badge className="absolute top-1 right-1 bg-blue-100 text-blue-700 border-2 border-blue-300 font-black z-10 text-xs">
                Current
              </Badge>
              <div className="p-3 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl border-2 border-blue-200 h-full overflow-hidden">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                      FROM 
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate pr-8">
                      {existingItem.pharmacyName}
                    </p>
                  </div>
                      <div>
                        <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                          Price per Unit
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-blue-600">
                          ₦{existingItem.price.toLocaleString()} x{existingItem.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                          Total
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          ₦{(existingItem.price * existingItem.quantity).toLocaleString()}
                        </p>
                      </div>
                </div>
              </div>
            </div>

            {/* New Item */}
            <div className="relative min-w-0 pt-3">
              {newIsCheaper && (
                <Badge className="absolute top-1 right-1 bg-green-100 text-green-700 border-2 border-green-300 font-black z-10 text-xs">
                  Cheaper!
                </Badge>
              )}
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 h-full ${
                newIsCheaper 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                      FROM
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate pr-8">
                      {newItem.pharmacyName}
                    </p>
                  </div>
                      <div>
                        <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                          Price per Unit
                        </p>
                        <p className={`text-xl sm:text-2xl font-black ${
                          newIsCheaper ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          ₦{newItem.price.toLocaleString()} x{newItem.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">
                          Total
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          ₦{(newItem.price * newItem.quantity).toLocaleString()}
                        </p>
                      </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Difference Alert */}
          {priceDiff !== 0 && (
            <div className={`p-3 sm:p-4 rounded-xl border-2 ${
              newIsCheaper 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <p className={`text-xs sm:text-sm font-bold text-center ${
                newIsCheaper ? 'text-green-700' : 'text-orange-700'
              }`}>
                {newIsCheaper 
                  ? `💰 Save ₦${savingsAmount.toLocaleString()} by switching to ${newItem.pharmacyName}`
                  : `⚠️ ${newItem.pharmacyName} is ₦${savingsAmount.toLocaleString()} more expensive`
                }
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3 pt-2">
            {/* Replace Option */}
            <Button
              onClick={handleReplace}
              disabled={isProcessing}
              className="w-full h-12 sm:h-14 rounded-xl font-black text-sm sm:text-base bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" strokeWidth={3} />
              <span className="truncate">
                Replace with {newItem.pharmacyName}
                {newIsCheaper && ` (Save ₦${savingsAmount.toLocaleString()})`}
              </span>
            </Button>

            {/* Keep Existing Option */}
            <Button
              onClick={handleKeep}
              disabled={isProcessing}
              variant="outline"
              className="w-full h-10 sm:h-12 rounded-xl font-bold text-sm sm:text-base border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              <span className="truncate">Keep {existingItem.pharmacyName}</span>
            </Button>

            {/* Add Both Option */}
            <Button
              onClick={handleAddBoth}
              disabled={isProcessing}
              variant="outline"
              className="w-full h-10 sm:h-12 rounded-xl font-bold text-xs sm:text-sm border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 text-gray-600"
            >
              Add Both (Buy from different pharmacies)
            </Button>

            {/* Cancel */}
            <Button
              onClick={onClose}
              disabled={isProcessing}
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

export default DuplicateMedicationDialog;