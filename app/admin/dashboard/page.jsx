'use client';
   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';
   import { jwtDecode } from 'jwt-decode';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import * as z from 'zod';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
   import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
   import { Input } from '@/components/ui/input';
   import { Checkbox } from '@/components/ui/checkbox';
   
   const formSchema = z.object({
     name: z.string().min(1, 'Name is required'),
     address: z.string().min(1, 'Address is required'),
     lga: z.string().min(1, 'LGA is required'),
     state: z.string().min(1, 'State is required'),
     phone: z.string().min(1, 'Phone is required'),
     licenseNumber: z.string().min(1, 'License number is required'),
     status: z.enum(['pending', 'verified', 'rejected']),
   });
   const editPharmacySchema = z.object({
     name: z.string().min(1, 'Pharmacy name required'),
     address: z.string().min(1, 'Address required'),
     lga: z.string().min(1, 'LGA required'),
     state: z.string().min(1, 'State required'),
     phone: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
     licenseNumber: z.string().min(1, 'License number required'),
     status: z.enum(['pending', 'verified', 'rejected']),
   });
   export default function AdminDashboard() {
     const [pharmacies, setPharmacies] = useState([]);
     const [users, setUsers] = useState([]);
     const [orders, setOrders] = useState([]);
     const [error, setError] = useState(null);
     const [editingPharmacyId, setEditingPharmacyId] = useState(null);
     const router = useRouter();
     const form = useForm({
       resolver: zodResolver(editPharmacySchema),
       defaultValues: {
         name: '',
         address: '',
         lga: '',
         state: '',
         phone: '',
         licenseNumber: '',
         isApproved: false,
       },
     });
     useEffect(() => {
       const token = localStorage.getItem('token');
       if (!token) {
         router.push('/admin/login');
         return;
       }
       try {
         const decoded = jwtDecode(token);
         if (decoded.role !== 'super admin') {
           localStorage.removeItem('token');
           router.push('/admin/login');
         }
       } catch (err) {
         console.error('Invalid token:', err);
         localStorage.removeItem('token');
         router.push('/admin/login');
       }
     }, [router]);
const fetchPharmacies = async () => {
     try {
       setError(null);
       const token = localStorage.getItem('token');
       if (!token) {
         throw new Error('No token found');
       }
       const response = await fetch('http://localhost:5000/api/admin/pharmacies', {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (!response.ok) {
         const text = await response.text();
         console.error('Fetch pharmacies failed:', { status: response.status, text });
         throw new Error(`Failed to fetch pharmacies: ${response.status} ${text.slice(0, 100)}`);
       }
       const data = await response.json();
       console.log('Pharmacies fetched:', data);
       setPharmacies(data.pharmacies);
     } catch (err) {
       console.error('Fetch pharmacies error:', err);
       setError(err.message);
       if (err.message.includes('Invalid token') || err.message.includes('No token')) {
         localStorage.removeItem('token');
         router.push('/admin/login');
       }
     }
   };
   const fetchUsers = async () => {
     try {
       setError(null);
       const token = localStorage.getItem('token');
       if (!token) {
         throw new Error('No token found');
       }
       const response = await fetch('http://localhost:5000/api/admin/users', {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (!response.ok) {
         const text = await response.text();
         console.error('Fetch users failed:', { status: response.status, text });
         throw new Error(`Failed to fetch users: ${response.status} ${text.slice(0, 100)}`);
       }
       const data = await response.json();
       console.log('Users fetched:', data);
       setUsers(data.users);
     } catch (err) {
       console.error('Fetch users error:', err);
       setError(err.message);
       if (err.message.includes('Invalid token') || err.message.includes('No token')) {
         localStorage.removeItem('token');
         router.push('/admin/login');
       }
     }
   };
   const fetchOrders = async () => {
     try {
       setError(null);
       const token = localStorage.getItem('token');
       if (!token) {
         throw new Error('No token found');
       }
       const response = await fetch('http://localhost:5000/api/admin/orders', {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (!response.ok) {
         const text = await response.text();
         console.error('Fetch orders failed:', { status: response.status, text });
         throw new Error(`Failed to fetch orders: ${response.status} ${text.slice(0, 100)}`);
       }
       const data = await response.json();
       console.log('Orders fetched:', data);
       setOrders(data.orders);
     } catch (err) {
       console.error('Fetch orders error:', err);
       setError(err.message);
       if (err.message.includes('Invalid token') || err.message.includes('No token')) {
         localStorage.removeItem('token');
         router.push('/admin/login');
       }
     }
   };
     useEffect(() => {
       fetchPharmacies();
       fetchUsers();
       fetchOrders();
     }, []);
     const handleEditPharmacy = async (values, pharmacyId) => {
       try {
         setError(null);
         const token = localStorage.getItem('token');
         const response = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${token}`,
           },
           body: JSON.stringify(values),
         });
         const data = await response.json();
         if (!response.ok) {
           throw new Error(data.message || 'Failed to update pharmacy');
         }
         console.log('Pharmacy updated:', data);
         setEditingPharmacyId(null);
         form.reset();
         fetchPharmacies();
       } catch (err) {
         console.error('Edit pharmacy error:', err);
         setError(err.message);
       }
     };
     const handleDeletePharmacy = async (pharmacyId) => {
       if (!confirm('Are you sure you want to delete this pharmacy?')) return;
       try {
         setError(null);
         const token = localStorage.getItem('token');
         const response = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
           method: 'DELETE',
           headers: { Authorization: `Bearer ${token}` },
         });
         const data = await response.json();
         if (!response.ok) {
           throw new Error(data.message || 'Failed to delete pharmacy');
         }
         console.log('Pharmacy deleted:', { pharmacyId });
         fetchPharmacies();
       } catch (err) {
         console.error('Delete pharmacy error:', err);
         setError(err.message);
       }
     };
     const startEditing = (pharmacy) => {
       setEditingPharmacyId(pharmacy.id);
       form.reset({
         name: pharmacy.name,
         address: pharmacy.address,
         lga: pharmacy.lga,
         state: pharmacy.state,
         phone: pharmacy.phone,
         licenseNumber: pharmacy.licenseNumber,
         isApproved: pharmacy.isApproved,
       });
     };
     const cancelEditing = () => {
       setEditingPharmacyId(null);
       form.reset();
     };
     const handleLogout = () => {
       localStorage.removeItem('token');
       router.push('/admin/login');
     };
     return (
       <div className="container mx-auto p-4">
         <div className="flex justify-between items-center mb-4">
           <h1 className="text-2xl font-bold text-indigo-800">Admin Dashboard</h1>
           <Button
             onClick={handleLogout}
             className="bg-red-600 hover:bg-red-700 text-white"
           >
             Logout
           </Button>
         </div>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         <Card className="border-indigo-100 shadow-md mb-6">
           <CardHeader>
             <CardTitle className="text-indigo-800">Manage Pharmacies</CardTitle>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="text-indigo-800">Name</TableHead>
                   <TableHead className="text-indigo-800">Address</TableHead>
                   <TableHead className="text-indigo-800">LGA</TableHead>
                   <TableHead className="text-indigo-800">State</TableHead>
                   <TableHead className="text-indigo-800">Phone</TableHead>
                   <TableHead className="text-indigo-800">License</TableHead>
                   <TableHead className="text-indigo-800">Status</TableHead>
                   <TableHead className="text-indigo-800">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {pharmacies.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={8} className="text-gray-600 text-center">
                       No pharmacies found.
                     </TableCell>
                   </TableRow>
                 ) : (
                   pharmacies.map((pharmacy) => (
                     <TableRow key={pharmacy.id}>
                       {editingPharmacyId === pharmacy.id ? (
                         <TableCell colSpan={8}>
                           <Form {...form}>
                             <form
                               onSubmit={form.handleSubmit((values) => handleEditPharmacy(values, pharmacy.id))}
                               className="space-y-4"
                             >
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <FormField
                                   control={form.control}
                                   name="name"
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>Name</FormLabel>
                                       <FormControl>
                                         <Input className="border-indigo-300" {...field} />
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )}
                                 />
                                 <FormField
                                   control={form.control}
                                   name="address"
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>Address</FormLabel>
                                       <FormControl>
                                         <Input className="border-indigo-300" {...field} />
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )}
                                 />
                                 <FormField
                                   control={form.control}
                                   name="lga"
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>LGA</FormLabel>
                                       <FormControl>
                                         <Input className="border-indigo-300" {...field} />
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )}
                                 />
                                 <FormField
                                   control={form.control}
                                   name="state"
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>State</FormLabel>
                                       <FormControl>
                                         <Input className="border-indigo-300" {...field} />
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )}
                                 />
                                 <FormField
                                   control={form.control}
                                   name="phone"
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>Phone</FormLabel>
                                       <FormControl>
                                         <Input className="border-indigo-300" {...field} />
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )}
                                 />
                                 <FormField
                                   control={form.control}
                                   name="licenseNumber"
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>License Number</FormLabel>
                                       <FormControl>
                                         <Input className="border-indigo-300" {...field} />
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )}
                                 />
                                 <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="border-indigo-300">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                               </div>
                               <div className="flex space-x-2">
                                 <Button
                                   type="submit"
                                   className="bg-green-600 hover:bg-green-700 text-white"
                                 >
                                   Save
                                 </Button>
                                 <Button
                                   type="button"
                                   variant="outline"
                                   className="border-indigo-300 text-indigo-600 hover:bg-indigo-100"
                                   onClick={cancelEditing}
                                 >
                                   Cancel
                                 </Button>
                               </div>
                             </form>
                           </Form>
                         </TableCell>
                       ) : (
                         <>
                        <TableCell>{pharmacy?.name || 'N/A'}</TableCell>
                        <TableCell>{pharmacy?.address || 'N/A'}</TableCell>
                        <TableCell>{pharmacy?.lga || 'N/A'}</TableCell>
                        <TableCell>{pharmacy?.state || 'N/A'}</TableCell>
                        <TableCell>{pharmacy?.phone || 'N/A'}</TableCell>
                        <TableCell>{pharmacy?.licenseNumber || 'N/A'}</TableCell>
                        <TableCell>{pharmacy?.status ? pharmacy.status.charAt(0).toUpperCase() + pharmacy.status.slice(1) : 'N/A'}</TableCell>
                           <TableCell>
                             <div className="flex space-x-2">
                               <Button
                                 className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                 onClick={() => startEditing(pharmacy)}
                               >
                                 Edit
                               </Button>
                               <Button
                                 className="bg-red-600 hover:bg-red-700 text-white"
                                 onClick={() => handleDeletePharmacy(pharmacy.id)}
                               >
                                 Delete
                               </Button>
                             </div>
                           </TableCell>
                         </>
                       )}
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
         <Card className="border-indigo-100 shadow-md mb-6">
           <CardHeader>
             <CardTitle className="text-indigo-800">Users</CardTitle>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="text-indigo-800">Name</TableHead>
                   <TableHead className="text-indigo-800">Email</TableHead>
                   <TableHead className="text-indigo-800">Role</TableHead>
                   <TableHead className="text-indigo-800">Pharmacy</TableHead>
                   <TableHead className="text-indigo-800">Created At</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {users.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="text-gray-600 text-center">
                       No users found.
                     </TableCell>
                   </TableRow>
                 ) : (
                   users.map((user) => (
                     <TableRow key={user.id}>
                <TableCell>{user?.name || 'N/A'}</TableCell>
                <TableCell>{user?.email || 'N/A'}</TableCell>
                <TableCell>{user?.role || 'N/A'}</TableCell>
                <TableCell>{user?.pharmacy?.name || 'N/A'}</TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
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
                   <TableHead className="text-indigo-800">Pharmacy</TableHead>
                   <TableHead className="text-indigo-800">Items</TableHead>
                   <TableHead className="text-indigo-800">Total</TableHead>
                   <TableHead className="text-indigo-800">Status</TableHead>
                   <TableHead className="text-indigo-800">Delivery Method</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {orders.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={8} className="text-gray-600 text-center">
                       No orders found.
                     </TableCell>
                   </TableRow>
                 ) : (
                   orders.map((order) => (
             <TableRow key={order.id}>
           <TableCell>{order?.trackingCode || 'N/A'}</TableCell>
           <TableCell>{order?.patientIdentifier || 'N/A'}</TableCell>
           <TableCell>
             {order?.items?.map((item) => (
               <div key={item.id}>
                 {item?.pharmacyMedication?.medication?.name || 'N/A'} (x{item?.quantity || 0})
               </div>
             ))}
           </TableCell>
           <TableCell>{order?.totalPrice?.toFixed(2) || '0.00'}</TableCell>
           <TableCell>{order?.status || 'N/A'}</TableCell>
           <TableCell>{order?.deliveryMethod || 'N/A'}</TableCell>
           <TableCell>{order?.paymentStatus || 'N/A'}</TableCell>
         </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
       </div>
     );
   }