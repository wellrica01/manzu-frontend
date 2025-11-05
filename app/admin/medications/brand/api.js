function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "http://192.168.221.67:5000";
const API_BASE = `${BACKEND_BASE}/api/admin/medications`;

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

export async function createMedication(formData) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    },
    credentials: 'include',
    body: formData,
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

// --- Search functions (Fixed to return consistent structure) ---

export async function searchManufacturers(searchTerm, limit = 20) {
  const query = new URLSearchParams({ search: searchTerm, limit }).toString();
  const res = await fetch(`${BACKEND_BASE}/api/admin/search/manufacturers?${query}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Search for manufacturers failed');
  const json = await res.json();
  
  // Return in the structure AutocompleteInput expects
  return {
    data: {
      manufacturers: json.data?.manufacturers || []
    }
  };
}

export async function searchActiveSubstances(searchTerm, limit = 20) {
  const query = new URLSearchParams({ search: searchTerm, limit }).toString();
  const res = await fetch(`${BACKEND_BASE}/api/admin/search/active-substances?${query}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Search for active substances failed');
  const json = await res.json();
  
  return {
    data: {
      activeSubstances: json.data?.activeSubstances || []
    }
  };
}

export async function searchMedicationIngredients(searchTerm, limit = 20) {
  const query = new URLSearchParams({ search: searchTerm, limit }).toString();
  const res = await fetch(`${BACKEND_BASE}/api/admin/search/medication-ingredients?${query}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Search for medication ingredients failed');
  const json = await res.json();
  
  return {
    data: {
      medicationIngredients: json.data?.medicationIngredients || []
    }
  };
}