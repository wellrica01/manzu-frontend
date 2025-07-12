import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Minus, Plus, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const CartItem = ({ item, handleQuantityChange, setRemoveItem, isUpdating, calculateItemPrice, segment = 'ready' }) => {
  const isPrescriptionRequired = item.medication.prescriptionRequired;

  // Segment-specific styling
  const getSegmentStyles = () => {
    switch (segment) {
      case 'prescription':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50/80',
          badge: 'border-[#225F91]/20 text-[#225F91]',
          price: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'ready':
      default:
        return {
          border: 'border-[#1ABA7F]/20',
          bg: 'bg-white/50',
          badge: 'border-[#225F91]/20 text-[#225F91]',
          price: 'text-[#225F91]',
          button: 'bg-[#225F91] hover:bg-[#1A4971]'
        };
    }
  };

  const styles = getSegmentStyles();

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-all duration-300 hover:shadow-sm",
      styles.border,
      styles.bg
    )}>
      {/* Item Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-gray-900 truncate">
              {item.medication.displayName}
            </h3>
            {isPrescriptionRequired && (
              <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                {segment === 'prescription' ? (
                  <>
                    <FileText className="h-3 w-3 mr-1" />
                    Rx Required
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </>
                )}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{item.medication.genericName}</p>
        </div>
        
        {/* Price Display */}
        <div className="text-right ml-3">
          <div className={cn("text-base font-bold", styles.price)}>
            ₦{calculateItemPrice(item).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            ₦{item.price.toLocaleString()} each
          </div>
        </div>
      </div>

      {/* Item Details - Simplified */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Category:</span>
          <span className="font-medium text-gray-900">{item.medication.category || 'General'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Form:</span>
          <span className="font-medium text-gray-900">{item.medication.form || 'Tablet'}</span>
        </div>
      </div>

      {/* Quantity Controls & Actions */}
      <div className="flex items-center justify-between">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <Button
            className={cn(
              "h-6 w-6 rounded-full text-white text-xs",
              styles.button
            )}
            onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.medication.displayName)}
            disabled={item.quantity <= 1 || isUpdating[item.id]}
          >
            {isUpdating[item.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
          </Button>
          
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              if (value >= 1) {
                handleQuantityChange(item.id, value, item.medication.displayName);
              }
            }}
            className="w-12 h-6 text-center text-xs font-medium rounded border-[#1ABA7F]/20 bg-white focus:border-[#1ABA7F]/50"
            min="1"
            max="99"
            disabled={isUpdating[item.id]}
          />
          
          <Button
            className={cn(
              "h-6 w-6 rounded-full text-white text-xs",
              styles.button
            )}
            onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.medication.displayName)}
            disabled={isUpdating[item.id]}
          >
            {isUpdating[item.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>

        {/* Remove Button */}
        <Button
          className="h-6 px-3 rounded text-red-600 hover:bg-red-100 text-xs border border-red-200"
          onClick={() => setRemoveItem({ id: item.id, name: item.medication.displayName })}
          disabled={isUpdating[item.id]}
        >
          {isUpdating[item.id] ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Item Total */}
      <div className="mt-2 pt-2 border-t border-[#1ABA7F]/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Item Total:</span>
          <span className={cn("text-sm font-bold", styles.price)}>
            ₦{calculateItemPrice(item).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartItem;