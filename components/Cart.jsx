'use client';
     import { useState, useEffect } from 'react';
     import { useRouter } from 'next/navigation';
     import { Button } from '@/components/ui/button';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     import { Input } from '@/components/ui/input';
     import { v4 as uuidv4 } from 'uuid';
     export default function Cart() {
       const [cart, setCart] = useState({ items: [], total: 0 });
       const [error, setError] = useState(null);
       const router = useRouter();
       const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();
       if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
         localStorage.setItem('guestId', guestId);
       }
       const fetchCart = async () => {
         try {
           setError(null);
           const response = await fetch('http://localhost:5000/api/cart', {
             headers: { 'x-guest-id': guestId },
           });
           if (!response.ok) {
             throw new Error('Failed to fetch cart');
           }
           const data = await response.json();
           console.log('Cart data:', JSON.stringify(data, null, 2));
           setCart(data);
         } catch (err) {
           setError(err.message);
         }
       };
       useEffect(() => {
         fetchCart();
       }, []);
    const handleQuantityChange = async (orderItemId, newQuantity) => {
         if (!orderItemId) {
           console.error('Invalid orderItemId:', orderItemId);
           alert('Error: Invalid item ID');
           return;
         }
         if (newQuantity < 1) return;
         try {
           console.log('Updating quantity:', { orderItemId, newQuantity });
           const response = await fetch('http://localhost:5000/api/cart/update', {
             method: 'PUT',
             headers: {
               'Content-Type': 'application/json',
               'x-guest-id': guestId,
             },
             body: JSON.stringify({ orderItemId, quantity: newQuantity }),
           });
           if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.message || 'Failed to update quantity');
           }
           await fetchCart();
         } catch (err) {
           console.error('Quantity update error:', err);
           setError(err.message);
         }
       };
       const handleRemoveItem = async (orderItemId) => {
         if (!orderItemId) {
           console.error('Invalid orderItemId:', orderItemId);
           alert('Error: Invalid item ID');
           return;
         }
         try {
           console.log('Removing item:', { orderItemId });
           const response = await fetch(`http://localhost:5000/api/cart/remove/${orderItemId}`, {
             method: 'DELETE',
             headers: { 'x-guest-id': guestId },
           });
           if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.message || 'Failed to remove item');
           }
           await fetchCart();
         } catch (err) {
           console.error('Remove item error:', err);
           alert(`Error: ${err.message}`);
         }
       };
   const handleCheckout = () => {
    router.push('/checkout');
    };
       const calculateItemPrice = (item) => item.quantity * item.price;
       const calculateTotalPrice = () => cart.items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
       return (
         <div className="container mx-auto p-4">
           <h1 className="text-2xl font-bold text-indigo-800 mb-4">Your Cart</h1>
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
                     <p className="text-gray-700"><strong>Unit Price:</strong> ₦{item.price}</p>
                     <div className="flex items-center gap-2 my-2">
                       <strong className="text-gray-700">Quantity:</strong>
                       <Button
                         className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-2"
                         onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                         disabled={item.quantity <= 1}
                       >
                         -
                       </Button>
                       <Input
                         type="number"
                         value={item.quantity}
                         onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                         className="w-16 text-center border-indigo-300"
                         min="1"
                       />
                       <Button
                         className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-2"
                         onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                       >
                         +
                       </Button>
                     </div>
                     <p className="text-gray-700"><strong>Item Total:</strong> ₦{calculateItemPrice(item)}</p>
                     <Button
                       className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-2 mt-2"
                       onClick={() => handleRemoveItem(item.id)}
                     >
                       Remove
                     </Button>
                   </CardContent>
                 </Card>
               ))}
               <div className="text-right">
                 <p className="text-xl font-semibold text-indigo-800">
                   Total: ₦{calculateTotalPrice()}
                 </p>
                 <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" 
                 onClick={handleCheckout}
                 disabled={cart.items.length === 0}>
                   Proceed to Checkout
                 </Button>
               </div>
             </div>
           )}
         </div>
       );
     }