import { XCircle, AlertTriangle, AlertCircle, ArrowLeft } from 'lucide-react';

// Stock Validation Dialog Component
const StockValidationDialog = ({ validation, onClose, onReviewCart }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-orange-500" strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-2xl font-black text-white text-center">
          Stock Unavailable
        </h3>
        <p className="text-white/90 text-center text-sm mt-2">
          Some items in your cart are no longer available
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Unavailable Items */}
        {validation.unavailableItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-bold text-gray-900">Out of Stock</h4>
            </div>
            <div className="space-y-2">
              {validation.unavailableItems.map((item) => (
                <div 
                  key={item.orderItemId} 
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="font-semibold text-gray-900 text-sm">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    at {item.pharmacy}
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-1">
                    Requested: {item.requestedQty} • Available: 0
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partially Available Items */}
        {validation.partiallyAvailableItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h4 className="font-bold text-gray-900">Limited Stock</h4>
            </div>
            <div className="space-y-2">
              {validation.partiallyAvailableItems.map((item) => (
                <div 
                  key={item.orderItemId} 
                  className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <p className="font-semibold text-gray-900 text-sm">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    at {item.pharmacy}
                  </p>
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    Requested: {item.requestedQty} • Available: {item.availableQty}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Message */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            Please review your cart to remove unavailable items or adjust quantities 
            to match available stock.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
        <button
          onClick={onReviewCart}
          className="w-full py-4 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] hover:from-[#158f68] hover:to-[#1a4d75] text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            Review Cart
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
      </div>
    </div>
  </div>
);

export default StockValidationDialog;
