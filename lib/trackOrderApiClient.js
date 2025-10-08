const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 15000;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

export function validateTrackingCode(code) {
  return /^TRK-[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{3}$/.test(code);
}

export async function trackOrder(trackingCode) {
  if (!trackingCode) {
    throw new Error('Please enter a tracking code');
  }

  if (!validateTrackingCode(trackingCode)) {
    throw new Error('Invalid tracking code format (e.g., TRK-00A7-LMK6X1-J8Q)');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(
      `${API_URL}/api/med-track?trackingCode=${encodeURIComponent(trackingCode)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'An unexpected error occurred. Please try again.' };
      }

      let errorMsg = errorData.message || 'Order not found';
      
      if (
        (response.status === 404 && errorMsg === 'Orders not found or not ready for tracking') ||
        errorMsg === 'Orders not found or not ready for tracking'
      ) {
        errorMsg = 'No orders were found for this tracking code, or your order is not yet ready for tracking. Please check your code or try again later.';
      } else if (response.status === 500) {
        errorMsg = 'A server error occurred. Please try again later or contact support.';
      }

      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.orders || [];
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