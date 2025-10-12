// services/api.js or wherever you handle API calls
export async function registerPharmacy(pharmacyData, userData, gpsLocation) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pharmacy: {
        name: pharmacyData.name,
        licenseNumber: pharmacyData.licenseNumber,
        phone: pharmacyData.phone,
        address: pharmacyData.address,
        state: pharmacyData.state,
        lga: pharmacyData.lga,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        locationAccuracy: gpsLocation.accuracy,
        logoUrl: pharmacyData.logoUrl || null,
      },
      user: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}