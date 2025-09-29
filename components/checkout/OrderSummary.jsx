'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Truck, Store, CheckCircle } from 'lucide-react';

const OrderSummary = ({ pharmacies = [], calculateItemPrice, totalPrice = 0 }) => {
  // Count unique medications across all pharmacies
  const uniqueMedicationsCount = new Set(
    pharmacies.flatMap(ph => ph.items.map(item => item.medication.id))
  ).size;

  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm sticky top-8">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-[#1ABA7F]/10 to-transparent p-6">
        <CardTitle className="text-2xl font-bold text-[#225F91] flex items-center gap-3">
          <Package className="h-6 w-6" />
          Order Summary
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready for Checkout
          </Badge>
          <span className="text-sm text-gray-600">
            {uniqueMedicationsCount} medication{uniqueMedicationsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Medications by Pharmacy */}
        <div className="space-y-4">
          {pharmacies.map((group) => (
            <div key={group.pharmacy.id} className="space-y-3">
              {/* Pharmacy Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-[#1ABA7F]" />
                  <h4 className="font-semibold text-gray-900">{group.pharmacy.name}</h4>
                </div>
                <Badge variant="outline" className="text-xs border-[#1ABA7F]/20 text-[#1ABA7F]">
                  {group.items.length} medication{group.items.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Medications List */}
              <div className="space-y-2 ml-6">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {item.medication.fullName}
                        </span>
                        {item.medication.prescriptionRequired && (
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      {/* Ingredients list */}
                      <p className="text-sm text-gray-500 truncate">
                        {item.medication.ingredients?.map(
                          (ing) => `${ing.activeSubstance} ${ing.strengthValue}${ing.strengthUnit}`
                        ).join(' + ')}
                      </p>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.quantity} × ₦{item.price.toLocaleString()}
                      </div>
                      <div className="text-sm font-bold text-[#225F91]">
                        ₦{calculateItemPrice(item).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pharmacy Subtotal */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Subtotal for {group.pharmacy.name}:</span>
                <span className="text-sm font-semibold text-[#225F91]">
                  ₦{group.subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Delivery Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#1ABA7F]" />
            Delivery Information
          </h4>
          
          <div className="space-y-2 text-sm">
            {pharmacies.map((group) => (
              <div key={group.pharmacy.id} className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#1ABA7F] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{group.pharmacy.name}</p>
                  <p className="text-gray-600">{group.pharmacy.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Price Breakdown</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Medications Total:</span>
              <span className="font-medium text-gray-900">₦{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Delivery Fee:</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium text-gray-900">Included</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between py-3">
          <span className="text-lg font-semibold text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-[#225F91]">₦{totalPrice.toLocaleString()}</span>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-800">
              <p className="font-medium">Secure Checkout</p>
              <p>Your payment information is encrypted and secure.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
