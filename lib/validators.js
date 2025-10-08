/**
 * Ensures the API response is in a usable format.
 * Handles both array responses and { results: [...] } objects.
 */
export function validateResponse(data, options = {}) {
  if (!data) throw new Error('Empty API response');

  // Case 1️⃣: Backend returns a raw array
  if (Array.isArray(data)) {
    return data;
  }

  // Case 2️⃣: Backend returns an object with results property
  if (options.results && Array.isArray(data.results)) {
    return data.results;
  }

  // Case 3️⃣: Unexpected format — log and throw
  console.error('Unexpected API response structure:', data);
  throw new Error('Invalid API response format');
}
