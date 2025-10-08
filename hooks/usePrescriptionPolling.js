import { useEffect, useState } from "react";
import { loadPrescriptionStatuses } from '@/lib/cartApiClient';


export function usePrescriptionPolling(guestId, medicationIds, apiUrl) {
  const [statuses, setStatuses] = useState({});
  
  useEffect(() => {
    const poll = async () => {
      if (document.hidden || !navigator.onLine) return;
      
      const data = await loadPrescriptionStatuses(guestId, medicationIds, apiUrl);
      setStatuses(data);
    };
    
    const interval = setInterval(poll, 30000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) poll();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [guestId, medicationIds, apiUrl]);
  
  return statuses;
}