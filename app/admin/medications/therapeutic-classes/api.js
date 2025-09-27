function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/therapeutic-classes';

export async function fetchTherapeuticClasses(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch therapeutic classes');
  const json = await res.json();
  return { therapeuticClasses: json.data.therapeuticClasses, pagination: json.pagination };
}

export async function fetchTherapeuticClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch therapeutic class');
  const json = await res.json();
  return json.data.therapeuticClass;
}

export async function fetchTherapeuticChildren(id) {
  const res = await fetch(`${API_BASE}/${id}/children`, { headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch child classes');
  const json = await res.json();
  return json.data.children;
}

export async function createTherapeuticClass(data) {
  const res = await fetch(API_BASE, { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create therapeutic class');
  const json = await res.json();
  return json.data.therapeuticClass;
}

export async function updateTherapeuticClass(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update therapeutic class');
  const json = await res.json();
  return json.data.therapeuticClass;
}

export async function deleteTherapeuticClass(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete therapeutic class');
  return true;
}
