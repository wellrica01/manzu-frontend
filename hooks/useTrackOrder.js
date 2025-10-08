import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trackOrder as trackOrderApi } from '@/lib/trackOrderApiClient';

export function useTrackOrder() {
  return useMutation({
    mutationFn: (trackingCode) => trackOrderApi(trackingCode),
    onSuccess: (data) => {
      toast.success('Order details found!', { duration: 6000 });
      
      // Analytics tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'track_order', { trackingCode: data.trackingCode });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to track order', { duration: 6000 });
    }
  });
}