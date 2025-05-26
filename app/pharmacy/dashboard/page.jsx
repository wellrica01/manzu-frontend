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
import { UserPlus, LogOut, Package, UserCog, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
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
      if (!decoded.pharmacyId || !['manager', 'pharmacist'].includes(decoded.role)) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
        return;
      }
      setPharmacyId(decoded.pharmacyId);
      setUserRole(decoded.role);
    } catch (err) {
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
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    } finally {
      setLoading(false);
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
      setUsers(data.users);
    } catch (err) {
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
      fetchOrders();
    } catch (err) {
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
      addForm.reset();
      fetchUsers();
    } catch (err) {
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
      setEditingUserId(null);
      editForm.reset();
      fetchUsers();
    } catch (err) {
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
      fetchUsers();
    } catch (err) {
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

  if (!pharmacyId || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Pharmacy Dashboard
          </h1>
          <Button
            onClick={() => router.push('/pharmacy/profile')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <UserCog className="h-5 w-5 mr-2" />
            Profile
          </Button>
        </div>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        {userRole === 'manager' && (
          <Card className="card card-hover mb-6 fade-in">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                <UserPlus className="h-6 w-6 mr-2" />
                Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {userError && (
                <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
                  <p className="text-destructive font-medium">{userError}</p>
                </div>
              )}
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(handleAddUser)} className="space-y-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={addForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-medium">Name</FormLabel>
                          <FormControl>
                            <Input className="border-border" {...field} />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-medium">Email</FormLabel>
                          <FormControl>
                            <Input className="border-border" {...field} />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-medium">Password</FormLabel>
                          <FormControl>
                            <Input type="password" className="border-border" {...field} />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Add User
                  </Button>
                </form>
              </Form>
              <h3 className="text-lg font-semibold text-primary mb-4">Current Users</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">Name</TableHead>
                    <TableHead className="text-primary">Email</TableHead>
                    <TableHead className="text-primary">Role</TableHead>
                    <TableHead className="text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => (
                      <TableRow key={user.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                        {editingUserId === user.id ? (
                          <TableCell colSpan={4}>
                            <Form {...editForm}>
                              <form
                                id={`edit-form-${user.id}`}
                                onSubmit={editForm.handleSubmit((values) => handleEditUser(values, user.id))}
                                className="space-y-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={editForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-primary font-medium">Name</FormLabel>
                                        <FormControl>
                                          <Input className="border-border" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-destructive" />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={editForm.control}
                                    name="email"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-primary font-medium">Email</FormLabel>
                                        <FormControl>
                                          <Input className="border-border" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-destructive" />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    type="submit"
                                    className="bg-success hover:bg-success/90 text-primary-foreground"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-border text-primary hover:bg-muted"
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
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                  onClick={() => startEditing(user)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
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
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <Package className="h-6 w-6 mr-2" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Loading orders...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">Order ID</TableHead>
                    <TableHead className="text-primary">Tracking Code</TableHead>
                    <TableHead className="text-primary">Customer</TableHead>
                    <TableHead className="text-primary">Delivery Method</TableHead>
                    <TableHead className="text-primary">Address</TableHead>
                    <TableHead className="text-primary">Items</TableHead>
                    <TableHead className="text-primary">Total</TableHead>
                    <TableHead className="text-primary">Status</TableHead>
                    <TableHead className="text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-muted-foreground text-center">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order, index) => (
                      <TableRow key={order.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.trackingCode}</TableCell>
                        <TableCell>{order.patientIdentifier}</TableCell>
                        <TableCell>{order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</TableCell>
                        <TableCell>{getAddressDisplay(order)}</TableCell>
                        <TableCell>
                          {order.items.map(item => `${item.medication.name} (x${item.quantity})`).join(', ')}
                        </TableCell>
                        <TableCell>₦{order.totalPrice.toLocaleString()}</TableCell>
                        <TableCell>{order.status.replace('_', ' ').toUpperCase()}</TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => value && updateOrderStatus(order.id, value)}
                            disabled={!getNextStatuses(order.status, order.deliveryMethod).length}
                          >
                            <SelectTrigger className="border-border w-[150px]">
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
            )}
            <div className="mt-6 flex flex-wrap gap-4">
              <Button
                className="bg-success hover:bg-success/90 text-primary-foreground"
                onClick={() => router.push('/')}
              >
                Back to Home
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push('/pharmacy/inventory')}
              >
                Manage Inventory
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}