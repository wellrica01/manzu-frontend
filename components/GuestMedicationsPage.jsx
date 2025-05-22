'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function GuestOrder() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const { patientIdentifier } = useParams();
  const router = useRouter();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', guestId);
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setError('Unable to fetch location; showing all pharmacies');
        }
      );
    }
  }, []);

const fetchGuestOrder = async () => {
  try {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (userLocation) {
      queryParams.append('lat', userLocation.lat);
      queryParams.append('lng', userLocation.lng);
      queryParams.append('radius', '10');
    }
    const url = `http://localhost:5000/api/prescription/guest-order/${patientIdentifier}?${queryParams.toString()}`;
    console.log('Fetching guest order:', url);
    const response = await fetch(url, {
      headers: { 'x-guest-id': guestId },
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Guest order error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch guest order');
    }
    const data = await response.json();
    setMedications(data.medications || []);
  } catch (err) {
    console.error('Guest order fetch error:', err);
    setError(err.message || 'Unknown error');
    console.error('Stack trace:', err.stack);

  } finally {
    setLoading(false);
  }
};

  const fetchCart = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      setCartItems(data.items || []);
    } catch (err) {
      console.error('Fetch cart error:', err);
    }
  };

  useEffect(() => {
    if (patientIdentifier && userLocation) {
      fetchGuestOrder();
      fetchCart();
    }
  }, [patientIdentifier, userLocation]);

  const handleAddToCart = async (medicationId, pharmacyId, quantity) => {
    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ medicationId, pharmacyId, quantity }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }
      alert('Added to cart!');
      await fetchCart();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const isInCart = (medicationId, pharmacyId) => {
    return cartItems.some(
      (item) => item.pharmacyMedicationMedicationId === medicationId && item.pharmacyMedicationPharmacyId === pharmacyId
    );
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto bg-gray-50 rounded-xl">
      <h1 className="text-3xl font-bold text-teal-800">Your Prescription Medications</h1>
      {medications.length === 0 ? (
        <p className="text-teal-600">No medications found for this prescription.</p>
      ) : (
        medications.map((med) => (
          <Card key={med.id} className="bg-white border border-teal-100 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-teal-800">{med.displayName}</CardTitle>
              <p className="text-teal-600">Quantity: {med.quantity}</p>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-teal-700 mb-4">Available at:</h3>
              {med.availability && med.availability.length > 0 ? (
                <ul className="space-y-4">
                  {med.availability.map((avail) => (
                    <li
                      key={avail.pharmacyId}
                      className="flex items-center justify-between bg-teal-50 p-4 rounded-lg shadow-sm"
                    >
                      <div>
                        <span className="font-medium text-teal-800">{avail.pharmacyName}</span>
                        <p className="text-sm text-teal-600">{avail.address || 'Address not available'}</p>
                        <p className="text-sm text-teal-600">Price: ₦{avail.price.toLocaleString()}</p>
                        {avail.distance_km !== null && (
                          <p className="text-sm text-teal-600">Distance: ~{avail.distance_km} km</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAddToCart(med.id, avail.pharmacyId, med.quantity)}
                        disabled={isInCart(med.id, avail.pharmacyId)}
                        className={isInCart(med.id, avail.pharmacyId) ? 'bg-gray-200 text-gray-400' : 'bg-teal-600 hover:bg-teal-700 text-white'}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {isInCart(med.id, avail.pharmacyId) ? 'Added to Cart' : 'Add to Cart'}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-teal-500 italic">Not available at any verified pharmacy</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
      <Button
        className="bg-teal-600 hover:bg-teal-700 text-white rounded-full"
        onClick={() => router.push('/cart')}
        disabled={cartItems.length === 0}
      >
        View Cart
      </Button>
    </div>
  );
}