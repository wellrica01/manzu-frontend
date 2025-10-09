import React from 'react';
import { CheckCircle, XCircle, Check, Package, Clock, PackageCheck, Truck } from 'lucide-react';
import { getOrderSteps, getOrderStepIndex } from '@/lib/trackOrderUtils';

const OrderProgressTracker = ({ order }) => {
  const steps = [
    { key: 'placed', label: 'Placed', icon: Package },
    { key: 'processing', label: 'Processing', icon: Clock },
    { key: 'ready', label: 'Ready', icon: PackageCheck },
    { key: 'transit', label: 'In Transit', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];
  
  const currentIdx = 1; // Replace with actual logic from getOrderStepIndex

  if (order.status === 'CANCELLED') {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <XCircle className="h-6 w-6 text-red-600" strokeWidth={2} />
          <span className="text-red-900 font-bold">Order Cancelled</span>
        </div>
      </div>
    );
  }

  if (order.status === 'COMPLETED') {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle className="h-6 w-6 text-green-600" strokeWidth={2} />
          <span className="text-green-900 font-bold">Order Completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="relative flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`relative flex items-center justify-center rounded-full w-12 h-12 mb-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-[#1ABA7F] to-[#16a876] shadow-md' 
                    : isCurrent 
                    ? 'bg-gradient-to-br from-[#1ABA7F] to-[#16a876] shadow-lg ring-4 ring-[#1ABA7F]/20' 
                    : 'bg-gray-200'
                }`}>
                  {isCompleted || isCurrent ? (
                    <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-5 w-5 text-gray-500" strokeWidth={2} />
                  )}
                </div>
                <span className={`text-xs font-semibold text-center leading-tight ${
                  isCompleted || isCurrent ? 'text-[#1ABA7F]' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-gradient-to-r from-[#1ABA7F] to-[#16a876]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderProgressTracker;