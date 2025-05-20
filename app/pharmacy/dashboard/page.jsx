'use client';
   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';
   import { jwtDecode } from 'jwt-decode';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import * as z from 'zod';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
   import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
   import { Input } from '@/components/ui/input';

   const addUserSchema = z.object({
     name: z.string().min(1, 'Name is required'),
     email: z.string().email('Invalid email'),
     password: z.string().min(8, 'Password must be at least 8 characters'),
     role: z.literal('pharmacist', { errorMap: () => ({ message: 'Role must be pharmacist' }) }),
   });
   const editUserSchema = z.object({
     name: z.string().min(1, 'Name is required'),
     email: z.string().email('Invalid email'),
   });
   export default function PharmacyDashboard() {
     const [orders, setOrders] = useState([]);
     const [users, setUsers] = useState([]);
     const [error, setError] = useState(null);
     const [userError, setUserError] = useState(null);
     const [pharmacyId, setPharmacyId] = useState(null);
     const [userRole, setUserRole] = useState(null);
     const [editingUserId, setEditingUserId] = useState(null);
     const router = useRouter();
     const addForm = useForm({
       resolver: zodResolver(addUserSchema),
       defaultValues: { name: '', email: '', password: '', role: 'pharmacist' },
     });
     const editForm = useForm({
       resolver: zodResolver(editUserSchema),
       defaultValues: { name: '', email: '' },
     });


       useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    if (!token) {
      router.replace('/pharmacy/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      // Validate token is for PharmacyUser
      if (!decoded.pharmacyId || !['manager', 'pharmacist'].includes(decoded.role)) {
        console.error('Invalid token: Not a PharmacyUser');
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
        return;
      }
      setPharmacyId(decoded.pharmacyId);
      setUserRole(decoded.role);
    } catch (err) {
      console.error('Invalid token:', err);
      localStorage.removeItem('pharmacyToken');
      router.replace('/pharmacy/login');
    }
  }, [router]);

  const fetchOrders = async () => {
    if (!pharmacyId) return;
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`http://localhost:5000/api/pharmacy/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const fetchUsers = async () => {
    if (!pharmacyId) return;
    try {
      setUserError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`http://localhost:5000/api/pharmacy/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data = await response.json();
      console.log('Pharmacy users:', data);
      setUsers(data.users);
    } catch (err) {
      console.error('Fetch users error:', err);
      setUserError(err.message);
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  useEffect(() => {
    if (pharmacyId && userRole) {
      fetchOrders();
      if (userRole === 'manager') {
        fetchUsers();
      }
    }
  }, [pharmacyId, userRole]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`http://localhost:5000/api/pharmacy/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      console.log('Order status updated:', { orderId, status });
      fetchOrders();
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message);
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const handleAddUser = async (values) => {
    try {
      setUserError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch('http://localhost:5000/api/auth/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...values, pharmacyId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add user');
      }
      console.log('User added:', data);
      addForm.reset();
      fetchUsers();
    } catch (err) {
      console.error('Add user error:', err);
      setUserError(err.message);
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const handleEditUser = async (values, userId) => {
    try {
      setUserError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }
      console.log('User updated:', data);
      setEditingUserId(null);
      editForm.reset();
      fetchUsers();
    } catch (err) {
      console.error('Edit user error:', err);
      setUserError(err.message);
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      setUserError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }
      console.log('User deleted:', { userId });
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      setUserError(err.message);
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    editForm.reset({ name: user.name, email: user.email });
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    editForm.reset();
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

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    router.push('/pharmacy/login');
  };

  // Don't render until token is validated
  if (!pharmacyId || !userRole) {
    return null; // or a loading spinner
  }

     return (
       <div className="container mx-auto p-4">
         <div className="flex justify-between items-center mb-4">
           <h1 className="text-2xl font-bold text-indigo-800">Pharmacy Dashboard</h1>
           <Button
             onClick={() => router.push('/pharmacy/profile')}
             className="bg-indigo-600 hover:bg-indigo-700 text-white"
           >
             Profile
           </Button>
         </div>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         {userRole === 'manager' && (
           <Card className="border-indigo-100 shadow-md mb-6">
             <CardHeader>
               <CardTitle className="text-indigo-800">Manage Users</CardTitle>
             </CardHeader>
             <CardContent>
               {userError && <p className="text-red-600 font-medium mb-4">{userError}</p>}
               <Form {...addForm}>
                 <form onSubmit={addForm.handleSubmit(handleAddUser)} className="space-y-4 mb-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                       control={addForm.control}
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
                       control={addForm.control}
                       name="email"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Email</FormLabel>
                           <FormControl>
                             <Input className="border-indigo-300" {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={addForm.control}
                       name="password"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Password</FormLabel>
                           <FormControl>
                             <Input type="password" className="border-indigo-300" {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>
                   <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                     Add User
                   </Button>
                 </form>
               </Form>
               <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Users</h3>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="text-indigo-800">Name</TableHead>
                     <TableHead className="text-indigo-800">Email</TableHead>
                     <TableHead className="text-indigo-800">Role</TableHead>
                     <TableHead className="text-indigo-800">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {users.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-gray-600 text-center">
                         No users found.
                       </TableCell>
                     </TableRow>
                   ) : (
                     users.map((user) => (
                       <TableRow key={user.id}>
                         {editingUserId === user.id ? (
                           <TableCell colSpan={4}>
                             <Form {...editForm}>
                               <form
                                 id={`edit-form-${user.id}`}
                                 onSubmit={editForm.handleSubmit((values) => handleEditUser(values, user.id))}
                                 className="space-y-2"
                               >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <FormField
                                     control={editForm.control}
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
                                     control={editForm.control}
                                     name="email"
                                     render={({ field }) => (
                                       <FormItem>
                                         <FormLabel>Email</FormLabel>
                                         <FormControl>
                                           <Input className="border-indigo-300" {...field} />
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                 </div>
                                 <div className="flex space-x-2 mt-2">
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
                             <TableCell>{user.name}</TableCell>
                             <TableCell>{user.email}</TableCell>
                             <TableCell>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</TableCell>
                             <TableCell>
                               <div className="flex space-x-2">
                                 <Button
                                   className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                   onClick={() => startEditing(user)}
                                 >
                                   Edit
                                 </Button>
                                 <Button
                                   className="bg-red-600 hover:bg-red-700 text-white"
                                   onClick={() => handleDeleteUser(user.id)}
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
         )}
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
                  <Button
                 onClick={handleLogout}
                 className="bg-red-600 hover:bg-red-700 text-white"
               >
                 Logout
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     );
   }