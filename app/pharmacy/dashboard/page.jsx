'use client';
   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
   export default function PharmacyDashboard() {
     const [orders, setOrders] = useState([]);
     const [error, setError] = useState(null);
     const [pharmacyId, setPharmacyId] = useState(2); // Temporary: hardcoded
     const router = useRouter();
     const fetchOrders = async () => {
       try {
         setError(null);
         const response = await fetch(`http://localhost:5000/api/pharmacy/orders?pharmacyId=${pharmacyId}`);
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to fetch orders');
         }
         const data = await response.json();
         console.log('Pharmacy orders:', data);
         setOrders(data.orders);
       } catch (err) {
         console.error('Fetch orders error:', err);
         setError(err.message);
       }
     };
     useEffect(() => {
       fetchOrders();
     }, [pharmacyId]);
     const updateOrderStatus = async (orderId, status) => {
       try {
         const response = await fetch(`http://localhost:5000/api/pharmacy/orders/${orderId}?pharmacyId=${pharmacyId}`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ status }),
         });
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to update status');
         }
         console.log('Order status updated:', { orderId, status });
         fetchOrders(); // Refresh orders
       } catch (err) {
         console.error('Update status error:', err);
         setError(err.message);
       }
     };
     const getNextStatuses = (status, deliveryMethod) => {
       const nextStatuses = {
         confirmed: ['processing'],
         processing: deliveryMethod === 'pickup' ? ['ready_for_pickup'] : ['shipped'],
         shipped: ['delivered'],
         ready_for_pickup: [],
         delivered: [],
       };
       return nextStatuses[status] || [];
     };
     const getAddressDisplay = (order) => {
       if (order.deliveryMethod === 'pickup') {
         const addresses = [...new Set(order.items.map(item => `${item.pharmacy.name}: ${item.pharmacy.address}`))];
         return addresses.join(', ');
       }
       return order.address || 'N/A';
     };
     return (
       <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold text-indigo-800 mb-4">Pharmacy Dashboard</h1>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         <Card className="border-indigo-100 shadow-md">
           <CardHeader>
             <CardTitle className="text-indigo-800">Orders</CardTitle>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="text-indigo-800">Order ID</TableHead>
                   <TableHead className="text-indigo-800">Tracking Code</TableHead>
                   <TableHead className="text-indigo-800">Customer</TableHead>
                   <TableHead className="text-indigo-800">Delivery Method</TableHead>
                   <TableHead className="text-indigo-800">Address</TableHead>
                   <TableHead className="text-indigo-800">Items</TableHead>
                   <TableHead className="text-indigo-800">Total</TableHead>
                   <TableHead className="text-indigo-800">Status</TableHead>
                   <TableHead className="text-indigo-800">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {orders.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={9} className="text-gray-600 text-center">
                       No orders found.
                     </TableCell>
                   </TableRow>
                 ) : (
                   orders.map((order) => (
                     <TableRow key={order.id}>
                       <TableCell>{order.id}</TableCell>
                       <TableCell>{order.trackingCode}</TableCell>
                       <TableCell>{order.patientIdentifier}</TableCell>
                       <TableCell>{order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</TableCell>
                       <TableCell>{getAddressDisplay(order)}</TableCell>
                       <TableCell>
                         {order.items.map(item => `${item.medication.name} (x${item.quantity})`).join(', ')}
                       </TableCell>
                       <TableCell>₦{order.totalPrice}</TableCell>
                       <TableCell>{order.status.replace('_', ' ').toUpperCase()}</TableCell>
                       <TableCell>
                         <Select
                           onValueChange={(value) => value && updateOrderStatus(order.id, value)}
                           disabled={!getNextStatuses(order.status, order.deliveryMethod).length}
                         >
                           <SelectTrigger className="border-indigo-300 w-[150px]">
                             <SelectValue placeholder="Update Status" />
                           </SelectTrigger>
                           <SelectContent>
                             {getNextStatuses(order.status, order.deliveryMethod).map((status) => (
                               <SelectItem key={status} value={status}>
                                 {status.replace('_', ' ').toUpperCase()}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
                <div className="mt-4 space-x-4">
               <Button
                 className="bg-green-600 hover:bg-green-700 text-white"
                 onClick={() => router.push('/')}
               >
                 Back to Home
               </Button>
               <Button
                 className="bg-indigo-600 hover:bg-indigo-700 text-white"
                 onClick={() => router.push('/pharmacy/inventory')}
               >
                 Manage Inventory
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     );
   }