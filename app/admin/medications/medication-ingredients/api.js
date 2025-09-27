function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/medication-ingredients';

export async function fetchMedicationIngredients(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch medication ingredients');
  const json = await res.json();
  return { medicationIngredients: json.data.medicationIngredients, pagination: json.pagination };
}

export async function fetchMedicationIngredient(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch medication ingredient');
  const json = await res.json();
  return json.data.medicationIngredient;
}

export async function createMedicationIngredient(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create medication ingredient');
  const json = await res.json();
  return json.data.medicationIngredient;
}

export async function updateMedicationIngredient(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update medication ingredient');
  const json = await res.json();
  return json.data.medicationIngredient;
}

export async function deleteMedicationIngredient(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete medication ingredient');
  return true;
}
