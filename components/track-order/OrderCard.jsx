import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Store, ChevronDown, ChevronUp } from 'lucide-react';
import OrderProgressTracker from './OrderProgressTracker';
import OrderDetails from './OrderDetails';

export default function OrderCard({ 
  order, 
  index, 
  isExpandable, 
  isExpanded, 
  onToggle 
}) {
  return (
    <Card
      className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/20 rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 animate-in fade-in slide-in-from-bottom"
      style={{ animationDelay: `${0.1 * index}s` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />

      <CardHeader
        className={`relative z-10 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 p-6 space-y-6 ${
          isExpandable ? 'cursor-pointer' : ''
        }`}
        onClick={isExpandable ? onToggle : undefined}
      >
        {/* Header Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
              <Store className="h-6 w-6 text-[#225F91]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#225F91]">
                {order.pharmacy?.name || 'Pharmacy'}
              </h3>
              <p className="text-sm text-gray-600 font-medium">Order #{order.id}</p>
            </div>
          </div>
          {isExpandable && (
            <div className="flex items-center gap-3">
              {!isExpanded && (
                <span className="text-lg font-black text-[#225F91]">
                  ₦{order.totalPrice.toLocaleString()}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-6 w-6 text-[#225F91]" />
              ) : (
                <ChevronDown className="h-6 w-6 text-[#225F91]" />
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm ${
            order.status === 'COMPLETED' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : order.status === 'CANCELLED'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-orange-100 text-orange-800 border border-orange-200'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>

        {/* Progress Tracker */}
        <OrderProgressTracker order={order} />
      </CardHeader>

      {isExpanded && (
        <CardContent className="relative z-10 p-5 sm:p-8">
          <OrderDetails order={order} />
        </CardContent>
      )}
    </Card>
  );
}