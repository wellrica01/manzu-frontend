'use client';
import { useState, useEffect, useRef } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, LogOut, Package, UserCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.literal('pharmacist', { errorMap: () => ({ message: 'Role must be pharmacist' }) }),
});
const editUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email').trim(),
});

export default function PharmacyDashboard() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [userError, setUserError] = useState(null);
  const [pharmacyId, setPharmacyId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [pharmacyName, setPharmacyName] = useState('Pharmacy Dashboard');
  const [currentUserName, setCurrentUserName] = useState('User');
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState({ open: false, type: '', data: null });
  const router = useRouter();
  const addForm = useForm({
    resolver: zodResolver(addUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'pharmacist' },
  });
  const editForm = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: '', email: '' },
  });
  const formRef = useRef(null);

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
      setCurrentUserName(decoded.name || 'User');
    } catch (err) {
      localStorage.removeItem('pharmacyToken');
      router.replace('/pharmacy/login');
    }
  }, [router]);

  const fetchPharmacyDetails = async () => {
    try {
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacy details');
      }
      const data = await response.json();
      setPharmacyName(data.pharmacy?.name || 'Pharmacy Dashboard');
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchOrders = async () => {
    if (!pharmacyId) return;
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders`, {
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
      toast.error(err.message, { duration: 4000 });
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/users`, {
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
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  useEffect(() => {
    if (pharmacyId && userRole) {
      fetchPharmacyDetails();
      fetchOrders();
      if (userRole === 'manager') {
        fetchUsers();
      }
    }
  }, [pharmacyId, userRole]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders/${orderId}`, {
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
      toast.success('Order status updated successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'update_order_status', { orderId, status });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/add-user`, {
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
      toast.success('User added successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_user', { email: values.email });
      }
    } catch (err) {
      setUserError(err.message);
      toast.error(err.message, { duration: 4000 });
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/${userId}`, {
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
      toast.success('User updated successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'edit_user', { userId });
      }
    } catch (err) {
      setUserError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setUserError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }
      fetchUsers();
      toast.success('User deleted successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'delete_user', { userId });
      }
    } catch (err) {
      setUserError(err.message);
      toast.error(err.message, { duration: 4000 });
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">{pharmacyName} Dashboard</h1>
        </div>
            <Button
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90 text-primary-foreground text-sm py-2 px-6"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
      </div>
      {error && (
        <div className="card bg-destructive/10 border-l-4 border-destructive p-3" role="alert">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}
      {userRole === 'manager' && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-semibold text-primary flex items-center justify-between">
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Manage Users
              </div>
              <Button
                onClick={() => setShowDialog({ open: true, type: 'addUserForm', data: null })}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
                aria-label="Add new user"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {userError && (
              <div className="card bg-destructive/10 border-l-4 border-destructive p-3 mb-4" role="alert">
                <p className="text-destructive text-sm font-medium">{userError}</p>
              </div>
            )}
            <h3 className="text-base font-semibold text-primary mb-3">Current Users</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary text-sm">Name</TableHead>
                    <TableHead className="text-primary text-sm">Email</TableHead>
                    <TableHead className="text-primary text-sm">Role</TableHead>
                    <TableHead className="text-primary text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => (
                      <TableRow
                        key={user.id}
                        className="transition-opacity duration-300 hover:bg-muted/50"
                        style={{ animation: 'fadeIn 0.5s ease-in', animationDelay: `${0.1 * index}s` }}
                      >
                        {editingUserId === user.id ? (
                          <TableCell colSpan={4}>
                            <Form {...editForm}>
                              <form
                                id={`edit-form-${user.id}`}
                                onSubmit={editForm.handleSubmit((values) => setShowDialog({ open: true, type: 'editUser', data: { values, userId: user.id } }))}
                                className="space-y-4"
                                role="form"
                                aria-labelledby={`edit-user-form-${user.id}`}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={editForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-primary font-medium text-sm">Name</FormLabel>
                                        <FormControl>
                                          <Input className="border-border text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-destructive text-sm" />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={editForm.control}
                                    name="email"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-primary font-medium text-sm">Email</FormLabel>
                                        <FormControl>
                                          <Input className="border-border text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-destructive text-sm" />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    type="submit"
                                    className="bg-success hover:bg-success/90 text-primary-foreground text-sm py-2 px-6"
                                    aria-label="Save user changes"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-border text-primary hover:bg-muted text-sm py-2 px-6"
                                    onClick={cancelEditing}
                                    aria-label="Cancel editing"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell className="text-sm">{user.name}</TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell className="text-sm">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-1 px-4 transition-transform hover:scale-105"
                                  onClick={() => startEditing(user)}
                                  aria-label={`Edit user ${user.name}`}
                                >
                                  Edit
                                </Button>
                                <Button
                                  className="bg-destructive hover:bg-destructive/90 text-primary-foreground text-sm py-1 px-4 transition-transform hover:scale-105"
                                  onClick={() => setShowDialog({ open: true, type: 'deleteUser', data: user.id })}
                                  aria-label={`Delete user ${user.name}`}
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
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-sm mt-2">Loading orders...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary text-sm">Order ID</TableHead>
                    <TableHead className="text-primary text-sm">Tracking Code</TableHead>
                    <TableHead className="text-primary text-sm">Customer</TableHead>
                    <TableHead className="text-primary text-sm">Delivery Method</TableHead>
                    <TableHead className="text-primary text-sm">Address</TableHead>
                    <TableHead className="text-primary text-sm">Items</TableHead>
                    <TableHead className="text-primary text-sm">Total</TableHead>
                    <TableHead className="text-primary text-sm">Status</TableHead>
                    <TableHead className="text-primary text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-muted-foreground text-center text-sm">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order, index) => (
                      <TableRow
                        key={order.id}
                        className="transition-opacity duration-300"
                        style={{ animation: 'fadeIn 0.5s ease-in', animationDelay: `${0.1 * index}s` }}
                      >
                        <TableCell className="text-sm">{order.id}</TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]">{order.trackingCode}</TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]">{order.patientIdentifier}</TableCell>
                        <TableCell className="text-sm">{order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">{getAddressDisplay(order)}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">
                          {order.items.map(item => `${item.medication.name} (x${item.quantity})`).join(', ')}
                        </TableCell>
                        <TableCell className="text-sm">₦{order.totalPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{order.status.replace('_', ' ').toUpperCase()}</TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => value && setShowDialog({ open: true, type: 'updateStatus', data: { orderId: order.id, status: value } })}
                            disabled={!getNextStatuses(order.status, order.deliveryMethod).length}
                          >
                            <SelectTrigger className="border-border w-[150px] text-sm">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {getNextStatuses(order.status, order.deliveryMethod).map((status) => (
                                <SelectItem key={status} value={status} className="text-sm">
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
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showDialog.open} onOpenChange={() => setShowDialog({ open: false, type: '', data: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              {showDialog.type === 'addUserForm' && 'Add New User'}
              {showDialog.type === 'addUser' && 'Confirm Add User'}
              {showDialog.type === 'editUser' && 'Confirm Edit User'}
              {showDialog.type === 'deleteUser' && 'Confirm Delete User'}
              {showDialog.type === 'updateStatus' && 'Confirm Status Update'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {showDialog.type === 'addUserForm' ? (
              <Form {...addForm}>
                <form
                  onSubmit={addForm.handleSubmit((values) => setShowDialog({ open: true, type: 'addUser', data: values }))}
                  className="space-y-4"
                  ref={formRef}
                  role="form"
                  aria-labelledby="add-user-form"
                >
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium text-sm">Name</FormLabel>
                        <FormControl>
                          <Input className="border-border text-sm" {...field} />
                        </FormControl>
                        <FormMessage className="text-destructive text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium text-sm">Email</FormLabel>
                        <FormControl>
                          <Input className="border-border text-sm" {...field} />
                        </FormControl>
                        <FormMessage className="text-destructive text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium text-sm">Password</FormLabel>
                        <FormControl>
                          <Input type="password" className="border-border text-sm" {...field} />
                        </FormControl>
                        <FormMessage className="text-destructive text-sm" />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDialog({ open: false, type: '', data: null })}
                      className="w-full sm:w-auto text-sm py-2 px-6"
                      aria-label="Cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
                      aria-label="Add user"
                    >
                      Add User
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <p className="text-sm text-foreground">
                {showDialog.type === 'addUser' && `Add user ${showDialog.data?.name} with email ${showDialog.data?.email}?`}
                {showDialog.type === 'editUser' && `Update user ${showDialog.data?.values.name} with email ${showDialog.data?.values.email}?`}
                {showDialog.type === 'deleteUser' && 'Are you sure you want to delete this user? This action cannot be undone.'}
                {showDialog.type === 'updateStatus' && `Update order #${showDialog.data?.orderId} status to ${showDialog.data?.status.replace('_', ' ').toUpperCase()}?`}
              </p>
            )}
          </div>
          {showDialog.type !== 'addUserForm' && (
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog({ open: false, type: '', data: null })}
                className="w-full sm:w-auto text-sm py-2 px-6"
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showDialog.type === 'addUser') handleAddUser(showDialog.data);
                  if (showDialog.type === 'editUser') handleEditUser(showDialog.data.values, showDialog.data.userId);
                  if (showDialog.type === 'deleteUser') handleDeleteUser(showDialog.data);
                  if (showDialog.type === 'updateStatus') updateOrderStatus(showDialog.data.orderId, showDialog.data.status);
                }}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
                aria-label="Confirm action"
              >
                Confirm
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}