import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2 } from 'lucide-react';

const CartItem = ({ item, handleQuantityChange, setRemoveItem, isUpdating, calculateItemPrice }) => {
  return (
    <div className="border-b border-gray-200/50 py-4 last:border-b-0">
      <h3 className="text-lg font-semibold text-gray-900 truncate">{item.medication.displayName}</h3>
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-2 text-gray-600 text-sm sm:text-base font-medium">
        <p>
          <strong>Category:</strong> {item.medication.category}
        </p>
        <p>
          <strong>Prescription:</strong> {item.medication.prescriptionRequired ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Unit Price:</strong> ₦{item.price.toLocaleString()}
        </p>
        <p>
          <strong>Item Total:</strong> ₦{calculateItemPrice(item).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-3">
        <div className="flex items-center gap-2">
          <Button
            className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
            onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.medication.displayName)}
            disabled={item.quantity <= 1 || isUpdating[item.id]}
            aria-label={`Decrease quantity for ${item.medication.displayName}`}
          >
            {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '-'}
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, item.medication.displayName)}
            className="w-14 sm:w-16 h-8 sm:h-10 text-center text-sm sm:text-base font-medium rounded-xl border-gray-200/50 bg-white/95 focus:border-primary/50 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
            min="1"
            disabled={isUpdating[item.id]}
            aria-label={`Quantity for ${item.medication.displayName}`}
          />
          <Button
            className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
            onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.medication.displayName)}
            disabled={isUpdating[item.id]}
            aria-label={`Increase quantity for ${item.medication.displayName}`}
          >
            {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '+'}
          </Button>
        </div>
        <Button
          className="h-8 sm:h-10 px-3 sm:px-4 rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
          onClick={() => setRemoveItem({ id: item.id, name: item.medication.displayName })}
          disabled={isUpdating[item.id]}
          aria-label={`Remove ${item.medication.displayName} from cart`}
        >
          {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Remove
        </Button>
      </div>
    </div>
  );
};

export default CartItem;