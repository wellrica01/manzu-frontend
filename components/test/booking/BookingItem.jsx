import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

const BookingItem = ({ item, setRemoveItem, isUpdating }) => {
  return (
    <div className="border-b border-gray-200/50 py-4 last:border-b-0">
      <h3 className="text-lg font-semibold text-gray-900 truncate">{item.test?.displayName || 'Unknown Test'}</h3>
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-2 text-gray-600 text-sm sm:text-base font-medium">
        <p>
          <strong>Category:</strong> {item.test?.category || 'N/A'}
        </p>
         <p>
          <strong>Description:</strong> {item.test?.description || 'N/A'}
        </p>
        <p>
          <strong>Prep Instruction:</strong> {item.test?.prepInstructions || 'N/A'}
        </p>
        <p>
          <strong>Test Order Required:</strong> {item.test?.orderRequired ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Price:</strong> ₦{item.price}
        </p>
      </div>
      <div className="flex items-start sm:items-center gap-2 sm:gap-3 mt-3">
        <Button
          className="h-8 sm:h-10 px-3 sm:px-4 rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
          onClick={() => setRemoveItem({ id: item.id, name: item.test?.displayName || 'Unknown Test' })}
          disabled={isUpdating[item.id]}
          aria-label={`Remove ${item.test?.displayName || 'Unknown Test'} from booking`}
        >
          {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Remove
        </Button>
      </div>
    </div>
  );
};

export default BookingItem;