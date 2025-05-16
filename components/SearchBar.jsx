'use client';
     import { useState, useEffect } from 'react';
     import { Input } from '@/components/ui/input';
     import { Button } from '@/components/ui/button';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     import { v4 as uuidv4 } from 'uuid';
     export default function SearchBar() {
       const [searchTerm, setSearchTerm] = useState('');
       const [results, setResults] = useState([]);
       const [error, setError] = useState(null);
       const [cartItems, setCartItems] = useState([]);
       const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();
       if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
         localStorage.setItem('guestId', guestId);
       }
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
         fetchCart();
       }, []);
       const handleSearch = async () => {
         try {
           setError(null);
           const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchTerm)}`);
           if (!response.ok) {
             throw new Error('Search failed');
           }
           const data = await response.json();
           setResults(data);
           await fetchCart();
         } catch (err) {
           setError(err.message);
           setResults([]);
         }
       };
       const handleAddToCart = async (medicationId, pharmacyId) => {
         const quantity = 1;
         try {
           if (!medicationId || !pharmacyId) {
             throw new Error('Invalid medication or pharmacy');
           }
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
           item =>
             item.pharmacyMedicationMedicationId === medicationId &&
             item.pharmacyMedicationPharmacyId === pharmacyId
         );
       };
       return (
         <div className="space-y-4">
           <div className="flex gap-3">
             <Input
               type="text"
               placeholder="Search medications..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="max-w-md border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
             />
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSearch}>
               Search
             </Button>
           </div>
           {error && <p className="text-red-600 font-medium">{error}</p>}
           <div className="grid gap-4">
             {results.length === 0 && !error && searchTerm && (
               <p className="text-gray-600">No medications found.</p>
             )}
             {results.map((med) => (
               <Card key={med.id} className="border-indigo-100 shadow-md hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <CardTitle className="text-indigo-800">{med.name}</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-gray-700"><strong>Generic:</strong> {med.genericName}</p>
                   <p className="text-gray-700"><strong>NAFDAC:</strong> {med.nafdacCode}</p>
                   {med.imageUrl && (
                     <img src={med.imageUrl} alt={med.name} className="w-32 h-32 object-cover my-2 rounded-md" />
                   )}
                   <h3 className="font-semibold text-indigo-700 mt-2">Available at:</h3>
                   <ul className="list-disc pl-5 text-gray-700">
                     {med.availability && med.availability.length > 0 ? (
                       med.availability.map((avail, index) => (
                         <li key={index} className="flex justify-between items-center">
                           <span>{avail.pharmacyName}: {avail.stock} in stock, ₦{avail.price}</span>
                        <Button
                             className={`text-sm py-1 px-2 ${
                               isInCart(med.id, avail.pharmacyId)
                                 ? 'bg-gray-400 cursor-not-allowed'
                                 : 'bg-green-600 hover:bg-green-700 text-white'
                             }`}
                             disabled={isInCart(med.id, avail.pharmacyId)}
                             onClick={() => handleAddToCart(med.id, avail.pharmacyId)}
                           >
                             {isInCart(med.id, avail.pharmacyId) ? 'Added' : 'Add to Cart'}
                           </Button>
                         </li>
                       ))
                     ) : (
                       <li className="text-gray-600">Not available at any pharmacy</li>
                     )}
                   </ul>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       );
     }