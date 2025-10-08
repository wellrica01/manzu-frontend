import { ERROR_MESSAGES } from '../constants/checkout';

const REQUEST_TIMEOUT = 30000;

export async function submitCheckout(guestId, orderData, apiUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(
      `${apiUrl}/api/med-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Checkout failed');
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === "AbortError") {
      throw new Error(ERROR_MESSAGES["Request timeout"]);
    } else if (err.message === "Failed to fetch") {
      throw new Error(ERROR_MESSAGES["Network request failed"]);
    }
    
    throw err;
  }
}