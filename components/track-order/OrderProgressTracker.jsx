import React from 'react';
import { CheckCircle, XCircle, Check } from 'lucide-react';
import { getOrderSteps, getOrderStepIndex } from '@/lib/trackOrderUtils';

export default function OrderProgressTracker({ order }) {
  const steps = getOrderSteps(order);
  const currentIdx = getOrderStepIndex(order, steps);

  if (order.status === 'CANCELLED') {
    return (
      <div className="pt-4">
        <div className="flex items-center justify-center gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
          <XCircle className="h-6 w-6 text-red-600" />
          <span className="text-red-800 font-bold">Order Cancelled</span>
        </div>
      </div>
    );
  }

  if (order.status === 'COMPLETED') {
    return (
      <div className="pt-4">
        <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <span className="text-green-800 font-bold">Order Completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center z-10 flex-1">
                  <div className={`relative flex items-center justify-center rounded-full w-12 h-12 mb-3 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-[#1ABA7F] to-green-600 shadow-lg' 
                      : isCurrent 
                      ? 'bg-gradient-to-br from-[#1ABA7F] to-green-600 shadow-xl ring-4 ring-[#1ABA7F]/30' 
                      : 'bg-gray-300'
                  }`}>
                    {isCompleted || isCurrent ? (
                      <Check className="h-6 w-6 text-white" strokeWidth={3} />
                    ) : (
                      <Icon className="h-6 w-6 text-white" />
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-[#1ABA7F] animate-ping opacity-30" />
                    )}
                  </div>
                  <span className={`text-xs font-bold text-center ${
                    isCompleted || isCurrent ? 'text-[#1ABA7F]' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-2 mx-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-gradient-to-r from-[#1ABA7F] to-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}