function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/generic-names';

export async function fetchGenericNames(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch generic names: ${errorText}`);
  }

  const json = await res.json();

  // Ensure safe default values to prevent runtime errors
  return {
    genericNames: json?.data?.genericNames || [],
    pagination: json?.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
  };
}

export async function fetchGenericName(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch generic name');
  const json = await res.json();
  return json.data.genericName;
}

export async function createGenericName(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create generic name');
  const json = await res.json();
  return json.data.genericName;
}

export async function updateGenericName(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update generic name');
  const json = await res.json();
  return json.data.genericName;
}

export async function deleteGenericName(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete generic name');
  return true;
}
