import React from 'react';
import { MapPin, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const OrderDetails = ({ order }) => {
  return (
    <div className="space-y-6">
      {/* Order Info Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Tracking Code', value: order.trackingCode || 'N/A' },
          { label: 'Customer', value: order.name || 'Guest Order' },
          { 
            label: 'Order Placed', 
            value: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A' 
          },
          { 
            label: 'Payment Status', 
            value: order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending' 
          }
        ].map((item, idx) => (
          <div 
            key={idx} 
            className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200"
          >
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              {item.label}
            </p>
            <p className="text-sm font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-blue-600" strokeWidth={2} />
          <h4 className="font-bold text-gray-900">
            {order.deliveryMethod === 'PICKUP' ? 'Pickup Location' : 'Delivery Address'}
          </h4>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {order.deliveryMethod === 'PICKUP'
            ? (order.pharmacy?.address || 'Pickup address will be provided')
            : (order.address || 'Delivery address on file')}
        </p>
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-[#1ABA7F]" strokeWidth={2} />
          <h4 className="font-bold text-gray-900 text-lg">Order Items</h4>
        </div>
        <div className="space-y-3">
          {order.items?.map(item => (
            <div 
              key={item.id} 
              className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 mb-1">
                  {item.medication?.displayName || item.medication?.brandName || 'Medication'}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: <span className="font-semibold">{item.quantity}</span>
                </p>
                {item.medication?.ingredients?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    {item.medication.ingredients
                      .map(ing => 
                        `${ing.activeSubstance || ''} ${ing.strengthValue ?? ''}${ing.strengthUnit ?? ''}`
                      )
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
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#225F91]/5 to-[#1ABA7F]/5 rounded-xl border-2 border-[#1ABA7F]/20">
        <span className="text-lg font-bold text-gray-900">Order Total</span>
        <span className="text-3xl font-black text-[#225F91]">
          ₦{(order.totalPrice || 0).toLocaleString()}
        </span>
      </div>

      {/* Cancellation Notice */}
      {order.status === 'CANCELLED' && (
        <div className="flex items-start gap-3 p-5 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900 mb-2">
              This order has been cancelled
            </p>
            {order.cancelReason && (
              <p className="text-sm text-red-800 mb-2">
                <span className="font-semibold">Reason:</span> {order.cancelReason}
              </p>
            )}
            {order.cancelledAt && (
              <p className="text-xs text-red-700">
                Cancelled on: {new Date(order.cancelledAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;