const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 15000;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

export async function fetchPrescriptionStatus(guestId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(
      `${API_URL}/api/prescription/${guestId}`,
      {
        headers: { 'x-guest-id': guestId },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch status');
    }

    return await response.json();
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

export async function retrieveSession(guestId, identifier) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const payload = identifier.includes('@')
      ? { email: identifier }
      : { phone: identifier };

    const response = await fetch(
      `${API_URL}/api/prescription/retrieve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message || 
        `Failed to retrieve session: ${response.statusText}`
      );
    }

    return await response.json();
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