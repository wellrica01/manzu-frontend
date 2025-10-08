import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Store, MapPin, Package } from 'lucide-react';

export default function OrderSummaryCard({ order, pharmacy }) {
  const isPickup = order.deliveryMethod !== 'COURIER';

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom">
      <CardHeader className="bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
              <Store className="h-6 w-6 text-[#225F91]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#225F91]">{pharmacy.name}</h3>
              <p className="text-sm text-gray-600 font-medium">Order #{order.id}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm ${
            order.status === 'COMPLETED' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : order.status === 'PENDING'
              ? 'bg-orange-100 text-orange-800 border border-orange-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {isPickup && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h4 className="font-bold text-gray-700">Pickup Address</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {[pharmacy.address, pharmacy.ward, pharmacy.lga, pharmacy.state]
                .filter(Boolean)
                .join(', ') || 'No address provided'}
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-[#1ABA7F]" />
            <h4 className="font-bold text-gray-700">Medications</h4>
          </div>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#1ABA7F]/30 transition-colors duration-200">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1ABA7F] flex-shrink-0 mt-2" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        {item.medication.ingredients?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.medication.ingredients
                            .map(ing => `${ing.activeSubstance || ''} ${ing.strengthValue ?? ''}${ing.strengthUnit ?? ''}`)
                            .join(' + ')}
                        </p>
                      )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm text-gray-600 font-medium">x{item.quantity}</span>
                  <span className="text-base font-black text-[#225F91]">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 rounded-xl border-2 border-[#1ABA7F]/20">
          <span className="text-lg font-bold text-gray-700">Order Total</span>
          <span className="text-2xl font-black text-[#225F91]">₦{order.totalPrice.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}