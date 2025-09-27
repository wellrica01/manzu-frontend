function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/anatomical-classes';

export async function fetchAnatomicalClasses(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch anatomical classes');
  const json = await res.json();
  return { anatomicalClasses: json.data.anatomicalClasses, pagination: json.pagination };
}

export async function fetchAnatomicalClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch anatomical class');
  const json = await res.json();
  return json.data.anatomicalClass;
}

export async function fetchAnatomicalChildren(id) {
  const res = await fetch(`${API_BASE}/${id}/children`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch child classes');
  const json = await res.json();
  return json.data.children;
}

export async function createAnatomicalClass(data) {
  const res = await fetch(API_BASE, { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create anatomical class');
  const json = await res.json();
  return json.data.anatomicalClass;
}

export async function updateAnatomicalClass(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update anatomical class');
  const json = await res.json();
  return json.data.anatomicalClass;
}

export async function deleteAnatomicalClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete anatomical class');
  return true;
}
