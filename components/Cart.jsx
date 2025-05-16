'use client';
     import { useState, useEffect } from 'react';
     import { Input } from '@/components/ui/input';
     import { Button } from '@/components/ui/button';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     export default function Cart() {
       const [cart, setCart] = useState({ items: [], total: 0 });
       const [error, setError] = useState(null);
       const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
       const fetchCart = async () => {
         try {
           const response = await fetch('http://localhost:5000/api/cart', {
             headers: { 'x-guest-id': guestId },
           });
           if (!response.ok) {
             throw new Error('Failed to fetch cart');
           }
           const data = await response.json();
           setCart(data);
         } catch (err) {
           setError(err.message);
         }
       };
       useEffect(() => {
         if (guestId) fetchCart();
       }, []);
       const handleUpdateQuantity = async (itemId, quantity) => {
         try {
           const response = await fetch('http://localhost:5000/api/cart/update', {
             method: 'PUT',
             headers: {
               'Content-Type': 'application/json',
               'x-guest-id': guestId,
             },
             body: JSON.stringify({ orderItemId: itemId, quantity }),
           });
           if (!response.ok) {
             throw new Error('Failed to update quantity');
           }
           fetchCart();
         } catch (err) {
           alert(`Error: ${err.message}`);
         }
       };
       const handleRemoveItem = async (itemId) => {
         try {
           const response = await fetch(`http://localhost:5000/api/cart/remove/${itemId}`, {
             method: 'DELETE',
             headers: { 'x-guest-id': guestId },
           });
           if (!response.ok) {
             throw new Error('Failed to remove item');
           }
           fetchCart();
         } catch (err) {
           alert(`Error: ${err.message}`);
         }
       };
       return (
         <div className="container mx-auto p-6 max-w-4xl">
           <h1 className="text-3xl font-extrabold text-indigo-800 mb-6">Your Cart</h1>
           {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
           {cart.items.length === 0 ? (
             <p className="text-gray-600">Your cart is empty.</p>
           ) : (
             <div className="space-y-4">
               {cart.items.map((item) => (
                 <Card key={item.id} className="border-indigo-100 shadow-md">
                   <CardHeader>
                     <CardTitle className="text-indigo-800">{item.medication.name}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-gray-700"><strong>Pharmacy:</strong> {item.pharmacy.name}</p>
                     <p className="text-gray-700"><strong>Price:</strong> ₦{item.price}</p>
                     <div className="flex items-center gap-2 mt-2">
                       <Input
                         type="number"
                         min="1"
                         value={item.quantity}
                         onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                         className="w-16 border-indigo-300 focus:border-indigo-500"
                       />
                       <Button
                         className="bg-red-600 hover:bg-red-700 text-white"
                         onClick={() => handleRemoveItem(item.id)}
                       >
                         Remove
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
               <div className="text-right">
                 <p className="text-xl font-semibold text-indigo-800">
                   Total: ₦{cart.total}
                 </p>
                 <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                   Proceed to Checkout
                 </Button>
               </div>
             </div>
           )}
         </div>
       );
     }