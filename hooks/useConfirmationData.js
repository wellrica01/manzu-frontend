import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchConfirmation } from '@/lib/confirmationApiClient';

export function useConfirmationData(guestId, session, reference) {
  return useQuery({
    queryKey: ['confirmation', session, reference],
    queryFn: () => fetchConfirmation(guestId, session, reference),
    enabled: !!guestId && !!session,
    staleTime: Infinity, // Confirmation data never changes
    retry: 2,
    onSuccess: (data) => {
      
      // Analytics tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'order_confirmed', {
          trackingCode: data.trackingCode,
          orderIds: data.pharmacies.flatMap(p => p.orders.map(o => o.id)).join(','),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to load confirmation', { 
        duration: 4000 
      });
    }
  });
}