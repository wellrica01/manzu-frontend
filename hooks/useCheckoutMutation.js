// useCheckoutMutation.js
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { submitCheckout } from '@/lib/checkoutApiClient'; 
import { ERROR_MESSAGES } from '../constants/checkout';

export function useCheckoutMutation(guestId, apiUrl, options = {}) {
  return useMutation({
    mutationFn: (orderData) => submitCheckout(guestId, orderData, apiUrl), 
    onError: (error) => {
      const message = ERROR_MESSAGES[error.message] || error.message || 'An error occurred during checkout';
      toast.error(message, { duration: 4000 });
    },
    ...options
  });
}