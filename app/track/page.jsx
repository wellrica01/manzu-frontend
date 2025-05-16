'use client';
   import { useState } from 'react';
   import { useRouter } from 'next/navigation';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Input } from '@/components/ui/input';
   import { Label } from '@/components/ui/label';
   export default function Track() {
     const [trackingCode, setTrackingCode] = useState('');
     const [order, setOrder] = useState(null);
     const [error, setError] = useState(null);
     const router = useRouter();
     const handleTrack = async (e) => {
       e.preventDefault();
       if (!trackingCode) {
         setError('Please enter a tracking code');
         return;
       }
       try {
         setError(null);
         setOrder(null);
         const response = await fetch(`http://localhost:5000/api/track?trackingCode=${trackingCode}`);
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to fetch order');
         }
         const data = await response.json();
         console.log('Track data:', data);
         setOrder(data.order);
       } catch (err) {
         console.error('Track error:', err);
         setError(err.message === 'Order not found' ? 'Order not found. Please check your tracking code.' : err.message);
       }
     };
     const calculateItemPrice = (item) => item.quantity * item.price;
     const getUniquePharmacyAddresses = () => {
       const addresses = [];
       const seen = new Set();
       order?.items.forEach(item => {
         const address = item.pharmacy?.address;
         const pharmacyName = item.pharmacy?.name;
         if (address && pharmacyName && !seen.has(address)) {
           addresses.push({ name: pharmacyName, address });
           seen.add(address);
         }
       });
       return addresses;
     };
     const handleBackToHome = () => {
       router.push('/');
     };
     return (
       <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold text-indigo-800 mb-4">Track Your Order</h1>
         <Card className="border-indigo-100 shadow-md mb-6">
           <CardHeader>
             <CardTitle className="text-indigo-800">Enter Tracking Code</CardTitle>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleTrack} className="space-y-4">
               <div>
                 <Label htmlFor="trackingCode" className="text-gray-700">Tracking Code</Label>
                 <Input
                   id="trackingCode"
                   value={trackingCode}
                   onChange={(e) => setTrackingCode(e.target.value)}
                   className="border-indigo-300"
                   placeholder="e.g., TRK-15-1747421013936"
                   required
                 />
               </div>
               <Button
                 type="submit"
                 className="bg-indigo-600 hover:bg-indigo-700 text-white"
               >
                 Track Order
               </Button>
             </form>
           </CardContent>
         </Card>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         {order && (
           <Card className="border-indigo-100 shadow-md">
             <CardHeader>
               <CardTitle className="text-indigo-800">Order Details</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 <p className="text-gray-700">
                   <strong>Order ID:</strong> {order.id}
                 </p>
                 <p className="text-gray-700">
                   <strong>Tracking Code:</strong> {order.trackingCode}
                 </p>
                 <p className="text-gray-700">
                   <strong>Customer:</strong> {order.patientIdentifier}
                 </p>
                 <p className="text-gray-700">
                   <strong>Order Status:</strong> {order.status}
                 </p>
                 <p className="text-gray-700">
                   <strong>Payment Status:</strong> {order.paymentStatus}
                 </p>
                 <p className="text-gray-700">
                   <strong>Delivery Method:</strong> {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                 </p>
                 {order.deliveryMethod === 'pickup' && order.items.length > 0 ? (
                   <div>
                     <strong className="text-gray-700">Pickup Addresses:</strong>
                     <div className="mt-2 space-y-2">
                       {getUniquePharmacyAddresses().length > 0 ? (
                         getUniquePharmacyAddresses().map((pharmacy, index) => (
                           <p key={index} className="text-gray-600">
                             {pharmacy.name}: {pharmacy.address}
                           </p>
                         ))
                       ) : (
                         <p className="text-gray-600">Pharmacy address not available</p>
                       )}
                     </div>
                   </div>
                 ) : (
                   <p className="text-gray-700">
                     <strong>Delivery Address:</strong> {order.address}
                   </p>
                 )}
                 <h3 className="text-lg font-semibold text-indigo-800">Order Items</h3>
                 {order.items.map((item) => (
                   <div key={item.id} className="mb-4">
                     <p className="text-gray-700 font-medium">{item.medication.name}</p>
                     <p className="text-gray-600">Pharmacy: {item.pharmacy.name}</p>
                     <p className="text-gray-600">Quantity: {item.quantity}</p>
                     <p className="text-gray-600">Unit Price: ₦{item.price}</p>
                     <p className="text-gray-600">Total: ₦{calculateItemPrice(item)}</p>
                   </div>
                 ))}
                 <p className="text-xl font-semibold text-indigo-800 text-right">
                   Total: ₦{order.totalPrice}
                 </p>
                 <Button
                   className="bg-green-600 hover:bg-green-700 text-white mt-4"
                   onClick={handleBackToHome}
                 >
                   Back to Home
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
       </div>
     );
   }