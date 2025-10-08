import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Check, 
  Store 
} from 'lucide-react';

export const DELIVERY_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Clock },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
];

export const PICKUP_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Clock },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: Store },
];

export function getOrderSteps(order) {
  return order.deliveryMethod === 'PICKUP' ? PICKUP_STEPS : DELIVERY_STEPS;
}

export function getOrderStepIndex(order, steps) {
  const idx = steps.findIndex(s => s.key === order.status);
  return idx >= 0 ? idx : 0;
}