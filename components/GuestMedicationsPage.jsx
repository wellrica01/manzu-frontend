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
      const response = await fetch(url, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch guest order');
      }
      const data = await response.json();
      setMedications(data.medications || []);
    } catch (err) {
      setError(err.message || 'Unknown error');
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

  if (loading) {
    return (
      <div className="text-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-2">Loading medications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mx-auto max-w-5xl fade-in">
        <p className="text-destructive font-medium">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {medications.length === 0 ? (
        <div className="card text-center py-10 fade-in">
          <p className="text-muted-foreground text-lg">
            No medications found for this prescription.{' '}
            <a href="/" className="text-primary hover:text-secondary">
              Search for medications
            </a>
          </p>
        </div>
      ) : (
        medications.map((med, index) => (
          <Card
            key={med.id}
            className="card card-hover fade-in"
            style={{ animationDelay: `${0.2 * index}s` }}
          >
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary">
                {med.displayName}
              </CardTitle>
              <p className="text-muted-foreground">Quantity: {med.quantity}</p>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="font-semibold text-primary mb-4">Available at:</h3>
              {med.availability && med.availability.length > 0 ? (
                <ul className="space-y-4">
                  {med.availability.map((avail) => (
                    <li
                      key={avail.pharmacyId}
                      className="card bg-primary/5 p-4 rounded-lg hover:bg-primary/10 transition-colors duration-200"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-foreground">
                        <div>
                          <span className="font-medium text-foreground">{avail.pharmacyName}</span>
                          <p className="text-sm text-muted-foreground">{avail.address || 'Address not available'}</p>
                          <p className="text-sm text-muted-foreground">Price: ₦{avail.price.toLocaleString()}</p>
                          {avail.distance_km !== null && (
                            <p className="text-sm text-muted-foreground">Distance: ~{avail.distance_km} km</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddToCart(med.id, avail.pharmacyId, med.quantity)}
                          disabled={isInCart(med.id, avail.pharmacyId)}
                          className={
                            isInCart(med.id, avail.pharmacyId)
                              ? 'bg-muted text-muted-foreground self-center'
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground self-center'
                          }
                        >
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          {isInCart(med.id, avail.pharmacyId) ? 'Added to Cart' : 'Add to Cart'}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">Not available at any verified pharmacy</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
        onClick={() => router.push('/cart')}
        disabled={cartItems.length === 0}
      >
        View Cart
      </Button>
    </div>
  );
}