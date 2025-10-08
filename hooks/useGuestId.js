import { useState, useEffect } from 'react';
import { getGuestId } from '../lib/utils';

export function useGuestId() {
  const [guestId, setGuestIdState] = useState(getGuestId()); 

  useEffect(() => {
    const handler = (event) => setGuestIdState(event.detail);
    window.addEventListener('guestIdChanged', handler);

    return () => window.removeEventListener('guestIdChanged', handler);
  }, []);

  return guestId;
}
