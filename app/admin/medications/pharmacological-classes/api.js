function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/pharmacological-classes';

export async function fetchPharmacologicalClasses(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch pharmacological classes');
  const json = await res.json();
  return { pharmacologicalClasses: json.data.pharmacologicalClasses, pagination: json.pagination };
}

export async function fetchPharmacologicalClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch pharmacological class');
  const json = await res.json();
  return json.data.pharmacologicalClass;
}

export async function fetchPharmacologicalChildren(id) {
  const res = await fetch(`${API_BASE}/${id}/children`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch child classes');
  const json = await res.json();
  return json.data.children;
}

export async function createPharmacologicalClass(data) {
  const res = await fetch(API_BASE, { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create pharmacological class');
  const json = await res.json();
  return json.data.pharmacologicalClass;
}

export async function updatePharmacologicalClass(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update pharmacological class');
  const json = await res.json();
  return json.data.pharmacologicalClass;
}

export async function deletePharmacologicalClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete pharmacological class');
  return true;
}
