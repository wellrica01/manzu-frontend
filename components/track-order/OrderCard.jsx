import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Store, ChevronDown, ChevronUp } from 'lucide-react';
import OrderProgressTracker from './OrderProgressTracker';
import OrderDetails from './OrderDetails';

const OrderCard = ({ 
  order, 
  index, 
  isExpandable, 
  isExpanded, 
  onToggle 
}) => {
  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader
        className={`relative bg-gradient-to-br from-gray-50 to-white p-6 border-b border-gray-100 ${
          isExpandable ? 'cursor-pointer hover:bg-gray-50/80 transition-colors duration-200' : ''
        }`}
        onClick={isExpandable ? onToggle : undefined}
      >
        {/* Header Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#1ABA7F] to-[#16a876] rounded-xl shadow-md">
              <Store className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#225F91]">
                {order.pharmacy?.name || 'Pharmacy Order'}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                Order #{order.id ? String(order.id).slice(-8) : 'N/A'}
              </p>
            </div>
          </div>
          {isExpandable && (
            <div className="flex items-center gap-4">
              {!isExpanded && (
                <span className="text-xl font-black text-[#225F91]">
                  ₦{(order.totalPrice || 0).toLocaleString()}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-6 w-6 text-[#225F91]" strokeWidth={2} />
              ) : (
                <ChevronDown className="h-6 w-6 text-[#225F91]" strokeWidth={2} />
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
            order.status === 'COMPLETED' 
              ? 'bg-green-50 text-green-900 border border-green-200'
              : order.status === 'CANCELLED'
              ? 'bg-red-50 text-red-900 border border-red-200'
              : 'bg-orange-50 text-orange-900 border border-orange-200'
          }`}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase() || 'Pending'}
          </div>
        </div>

        {/* Progress Tracker */}
        <OrderProgressTracker order={order} />
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-6">
          <OrderDetails order={order} />
        </CardContent>
      )}
    </Card>
  );
}

export default OrderCard;