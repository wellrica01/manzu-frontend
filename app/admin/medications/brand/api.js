function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/admin/medications';

export async function fetchMedications(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch medications");
  const json = await res.json();
  return {
    medications: json.data?.medications || [],
    pagination: json.pagination || { page: 1, limit: 10, total: 0, pages: 1 },
  };
}


export async function fetchMedication(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch medication');
  return res.json();
}

// Fixed API functions for frontend
export async function createMedication(formData) {
  // formData should already be a FormData object
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      // Don't set Content-Type - let browser set it for FormData
    },
    credentials: 'include',
    body: formData, // Pass FormData directly
  });

  if (!res.ok) {
    const errorResponse = await res.json();
    throw new Error(errorResponse.message || 'Failed to create medication');
  }
  return res.json();
}

export async function updateMedication(id, formData) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      // Don't set Content-Type for FormData
    },
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const errorResponse = await res.json();
    throw new Error(errorResponse.message || 'Failed to update medication');
  }
  return res.json();
}


export async function deleteMedication(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete medication');
  return res.json();
} 