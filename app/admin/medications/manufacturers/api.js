function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/manufacturers';

// Fetch all manufacturers with optional query params
export async function fetchManufacturers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch manufacturers');
  const json = await res.json();
  return { manufacturers: json.data.manufacturers, pagination: json.pagination };
}

// Fetch single manufacturer by ID
export async function fetchManufacturer(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch manufacturer');
  const json = await res.json();
  return json.data.manufacturer;
}

// Create a new manufacturer
export async function createManufacturer(data) {
  const res = await fetch(API_BASE, { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create manufacturer');
  const json = await res.json();
  return json.data.manufacturer;
}

// Update an existing manufacturer
export async function updateManufacturer(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update manufacturer');
  const json = await res.json();
  return json.data.manufacturer;
}

// Delete a manufacturer
export async function deleteManufacturer(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete manufacturer');
  return true;
}
