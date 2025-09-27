function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/chemical-classes';

export async function fetchChemicalClasses(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch chemical classes');
  const json = await res.json();
  return { chemicalClasses: json.data.chemicalClasses, pagination: json.pagination };
}

export async function fetchChemicalClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch chemical class');
  const json = await res.json();
  return json.data.chemicalClass;
}

export async function fetchChemicalChildren(id) {
  const res = await fetch(`${API_BASE}/${id}/children`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch child substances');
  const json = await res.json();
  return json.data.children;
}

export async function createChemicalClass(data) {
  const res = await fetch(API_BASE, { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create chemical class');
  const json = await res.json();
  return json.data.chemicalClass;
}

export async function updateChemicalClass(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update chemical class');
  const json = await res.json();
  return json.data.chemicalClass;
}

export async function deleteChemicalClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete chemical class');
  return true;
}
