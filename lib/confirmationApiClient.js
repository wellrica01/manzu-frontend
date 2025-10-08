const REQUEST_TIMEOUT = 15000;

export async function fetchConfirmation(guestId, session, reference) {
  if (!guestId || !session) {
    throw new Error('Missing guest ID or session ID');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const query = new URLSearchParams();
    query.append('session', session);
    if (reference) query.append('reference', reference);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/med-confirmation?${query.toString()}`,
      {
        headers: { 'x-guest-id': guestId },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to verify payment');
    }

    const data = await response.json();
    
    return {
      pharmacies: data.pharmacies || [],
      trackingCode: data.trackingCode || '',
      checkoutSessionId: data.checkoutSessionId || '',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    } else if (err.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw err;
  }
}
