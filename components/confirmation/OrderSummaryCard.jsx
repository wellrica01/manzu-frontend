import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  CheckCircle, 
  ShieldCheck, 
  MapPin, 
  Store, 
  Package,
  Home,
  Printer,
  Clock
} from 'lucide-react';

const OrderSummaryCard = ({ order, pharmacy }) =>{
  const isPickup = order.deliveryMethod !== 'COURIER';

  return (
    <Card className="bg-white border-2 border-gray-100 rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-br from-gray-50 to-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#1ABA7F] to-[#16a876] rounded-xl shadow-md">
              <Store className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#225F91]">{pharmacy.name}</h3>
              <p className="text-sm text-gray-600 font-medium">
                Order #{String(order.id)?.slice(-8) || 'N/A'}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
            order.status === 'COMPLETED' 
              ? 'bg-green-50 text-green-900 border border-green-200' 
              : order.status === 'PENDING'
              ? 'bg-orange-50 text-orange-900 border border-orange-200'
              : 'bg-gray-50 text-gray-900 border border-gray-200'
          }`}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Pickup Address */}
        {isPickup && (
          <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-blue-600" strokeWidth={2} />
              <h4 className="font-bold text-gray-900">Pickup Location</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {[pharmacy.address, pharmacy.ward, pharmacy.lga, pharmacy.state]
                .filter(Boolean)
                .join(', ') || 'Address to be confirmed'}
            </p>
          </div>
        )}

        {/* Medications */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-[#1ABA7F]" strokeWidth={2} />
            <h4 className="font-bold text-gray-900">Order Items</h4>
          </div>
          <div className="space-y-3">
            {order.items?.map(item => (
              <div 
                key={item.id} 
                className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 mb-1">
                    {item.medication?.displayName || 'Medication'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: <span className="font-semibold">{item.quantity}</span>
                  </p>
                  {item.medication?.ingredients?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      {item.medication.ingredients
                        .map(ing => `${ing.activeSubstance || ''} ${ing.strengthValue ?? ''}${ing.strengthUnit ?? ''}`)
                        .join(' + ')}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className="text-lg font-black text-[#225F91]">
                    ₦{((item.price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#225F91]/5 to-[#1ABA7F]/5 rounded-2xl border-2 border-[#1ABA7F]/20">
          <span className="text-lg font-bold text-gray-900">Order Total</span>
          <span className="text-3xl font-black text-[#225F91]">
            ₦{(order.totalPrice || 0).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderSummaryCard;