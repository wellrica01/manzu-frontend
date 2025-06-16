'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
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
import { ShoppingCart, Clock, CheckCircle, AlertTriangle, LogOut, UserPlus, Package, Loader2, DollarSign, Calendar, XCircle } from 'lucide-react';
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
  const [medications, setMedications] = useState([]);
  const [pharmacyId, setPharmacyId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('pharmacyToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch medications');
        }
        const data = await response.json();
        setMedications(data.medications);
      } catch (error) {
        console.error('Failed to fetch medications:', error);
        setError(error.message);
        toast.error(error.message, { duration: 4000 });
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === 'processing').length,
      completedOrders: orders.filter((order) => ['delivered', 'ready_for_pickup'].includes(order.status)).length,
      lowStock: medications.filter((med) => med.stock <= 10).length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      recentOrders: orders.filter((order) => new Date(order.createdAt) >= sevenDaysAgo).length,
      outOfStock: medications.filter((med) => med.stock === 0).length,
    };
  }, [orders, medications]);

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
          Authorization: `Bearer ${token}` },
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

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (filterStatus === 'pending') {
      result = result.filter((order) => order.status === 'processing');
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, filterStatus]);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-7xl space-y-8">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-10 duration-700">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
              {pharmacyName}
            </h1>
          </div>
          <Button
            onClick={handleLogout}
            className="h-12 px-6 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5 mr-2" aria-hidden="true" />
            Logout
          </Button>
        </div>
<Card
  className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(59,130,246,0.3)]"
>
  <div className="absolute top-0 left-0 w-16 h-16 bg-primary/25 rounded-br-full opacity-70" />
  <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
    <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
      <ShoppingCart
        className="h-8 w-8 mr-3 text-primary/90 transition-transform duration-500 group-hover:scale-125"
        aria-hidden="true"
      />
      Dashboard Overview
    </CardTitle>
  </CardHeader>
  <CardContent className="p-6 sm:p-10 space-y-8">
    <div className="grid grid-cols-1 gap-8">
      {/* Orders Group */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-primary tracking-wide">Orders</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 border-2 border-gradient-to-r from-primary/30 to-blue-600/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in-20"
            style={{ animationDelay: '0.1s' }}
            aria-label={`Total Orders: ${metrics.totalOrders}`}
            onClick={() => console.log('Navigate to all orders')} // Add navigation logic
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <ShoppingCart className="h-10 w-10 text-primary/90" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/50 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
                  {metrics.totalOrders}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Total Orders</p>
              </div>
            </div>
          </div>
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 border-2 border-gradient-to-r from-primary/30 to-blue-600/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in-20"
            style={{ animationDelay: '0.2s' }}
            aria-label={`Pending Orders: ${metrics.pendingOrders}`}
            onClick={() => console.log('Navigate to pending orders')} // Add navigation logic
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <Clock className="h-10 w-10 text-primary/90" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/50 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
                  {metrics.pendingOrders}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Pending Orders</p>
              </div>
            </div>
          </div>
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 border-2 border-gradient-to-r from-primary/30 to-blue-600/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in-20"
            style={{ animationDelay: '0.3s' }}
            aria-label={`Completed Orders: ${metrics.completedOrders}`}
            onClick={() => console.log('Navigate to completed orders')} // Add navigation logic
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <CheckCircle className="h-10 w-10 text-primary/90" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/50 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
                  {metrics.completedOrders}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Completed Orders</p>
              </div>
            </div>
          </div>
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 border-2 border-gradient-to-r from-primary/30 to-blue-600/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in-20"
            style={{ animationDelay: '0.4s' }}
            aria-label={`Recent Orders: ${metrics.recentOrders}`}
            onClick={() => console.log('Navigate to recent orders')} // Add navigation logic
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <Calendar className="h-10 w-10 text-primary/90" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/50 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
                  {metrics.recentOrders}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Recent Orders (7d)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Medications Group */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-primary tracking-wide">Medications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 border-2 border-gradient-to-r from-primary/30 to-blue-600/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in-20"
            style={{ animationDelay: '0.5s' }}
            aria-label={`Low Stock Medications: ${metrics.lowStock}`}
            onClick={() => console.log('Navigate to low stock medications')} // Add navigation logic
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <AlertTriangle className="h-10 w-10 text-primary/90" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/50 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
                  {metrics.lowStock}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Low Stock Medications</p>
              </div>
            </div>
          </div>
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 border-2 border-gradient-to-r from-primary/30 to-blue-600/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in-20"
            style={{ animationDelay: '0.6s' }}
            aria-label={`Out of Stock Medications: ${metrics.outOfStock}`}
            onClick={() => console.log('Navigate to out of stock medications')} // Add navigation logic
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <XCircle className="h-10 w-10 text-primary/90" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/50 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
                  {metrics.outOfStock}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Out of Stock</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Revenue Group */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-primary tracking-wide">Revenue</h3>
        <div className="grid grid-cols-1 gap-6">
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 border-2 border-gradient-to-r from-primary/30 to-blue-600/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in-20"
            style={{ animationDelay: '0.7s' }}
            aria-label={`Total Revenue: ₦${metrics.totalRevenue.toLocaleString('en-NG')}`}
            onClick={() => console.log('Navigate to revenue overview')} // Add navigation logic
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <DollarSign className="h-10 w-10 text-primary/90" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/50 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate max-w-full">
                  {metrics.totalRevenue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

        {error && (
          <div
            className="bg-red-50/90 border-l-4 border-red-500 p-4 rounded-xl animate-in fade-in-20 duration-300"
            role="alert"
          >
            <p className="text-red-600 text-base font-medium">{error}</p>
          </div>
        )}

            <Card
      className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(59,130,246,0.3)]"
    >
      <div className="absolute top-0 left-0 w-16 h-16 bg-primary/25 rounded-br-full opacity-70" />
      <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
          <Package
            className="h-8 w-8 mr-3 text-primary/90 transition-transform duration-500 group-hover:scale-125"
            aria-hidden="true"
          />
          Orders
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            placeholder="Search by Order ID or Tracking Code"
            className="w-full sm:w-64 h-12 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
            aria-label="Search orders"
          />
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
            aria-label="Filter by status"
          >
            <SelectTrigger className="w-full sm:w-48 h-12 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md border-gray-100/30 rounded-2xl">
              <SelectItem value="pending">Pending Orders</SelectItem>
              <SelectItem value="all">All Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <Loader2
              className="h-12 w-12 animate-spin text-primary mx-auto"
              aria-hidden="true"
            />
            <p className="text-gray-600 text-lg font-medium mt-4">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/70 border-b border-gray-100/20">
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Order ID</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Tracking</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Customer</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Delivery</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Items</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Total</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Status</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-gray-500 text-center text-lg font-medium py-8"
                    >
                      No {filterStatus === 'pending' ? 'pending' : ''} orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className="border-b border-gray-100/10 transition-all duration-300 hover:bg-primary/10 animate-in fade-in-20"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <TableCell className="text-base font-medium text-gray-900 py-4">
                        <button
                          onClick={() => setShowDialog({ open: true, type: 'orderDetails', data: order })}
                          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                          aria-label={`View details for order ${order.id}`}
                        >
                          {order.id}
                        </button>
                      </TableCell>
                      <TableCell
                        className="text-base font-medium text-gray-900 truncate max-w-[120px] py-4"
                        title={order.trackingCode}
                      >
                        {order.trackingCode}
                      </TableCell>
                      <TableCell
                        className="text-base font-medium text-gray-900 truncate max-w-[120px] py-4"
                        title={order.patientIdentifier}
                      >
                        {order.patientIdentifier}
                      </TableCell>
                      <TableCell className="text-base font-medium text-gray-900 py-4">
                        {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                      </TableCell>
                      <TableCell
                        className="text-base font-medium text-gray-900 truncate max-w-[180px] py-4"
                        title={order.items.map((item) => `${item.medication.name} (x${item.quantity})`).join(', ')}
                      >
                        {order.items.map((item) => `${item.medication.name} (x${item.quantity})`).join(', ')}
                      </TableCell>
                      <TableCell className="text-base font-medium text-gray-900 py-4">
                        {order.totalPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                      </TableCell>
                      <TableCell className="py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'ready_for_pickup' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          aria-label={`Order status: ${order.status.replace('_', ' ').toUpperCase()}`}
                        >
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Select
                          onValueChange={(value) =>
                            value &&
                            setShowDialog({
                              open: true,
                              type: 'updateStatus',
                              data: { orderId: order.id, status: value },
                            })
                          }
                          disabled={!getNextStatuses(order.status, order.deliveryMethod).length}
                        >
                          <SelectTrigger
                            className="w-[140px] h-10 rounded-xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                            aria-label="Update order status"
                          >
                            <SelectValue placeholder="Update" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-md border-gray-100/30 rounded-xl shadow-lg">
                            {getNextStatuses(order.status, order.deliveryMethod).map((status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                className="text-base font-medium text-gray-900 hover:bg-primary/10"
                              >
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

        {userRole === 'manager' && (
          <Card
            className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
          >
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center justify-between">
                <div className="flex items-center">
                  <UserPlus
                    className="h-7 w-7 mr-3 text-primary/80 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  Manage Users
                </div>
                <Button
                  onClick={() => setShowDialog({ open: true, type: 'addUserForm', data: null })}
                  className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
                  aria-label="Add new user"
                >
                  <UserPlus className="h-5 w-5 mr-2" aria-hidden="true" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              {userError && (
                <div
                  className="bg-red-50/90 border-l-4 border-red-500 p-4 mb-6 rounded-xl animate-in fade-in-20 duration-300"
                  role="alert"
                >
                  <p className="text-red-600 text-base font-medium">{userError}</p>
                </div>
              )}
              <h3 className="text-xl font-bold text-primary tracking-tight mb-4">Current Users</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="text-primary text-sm font-semibold">Name</TableHead>
                      <TableHead className="text-primary text-sm font-semibold">Email</TableHead>
                      <TableHead className="text-primary text-sm font-semibold">Role</TableHead>
                      <TableHead className="text-primary text-sm font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-gray-500 text-center text-base font-medium py-6"
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user, index) => (
                        <TableRow
                          key={user.id}
                          className="transition-all duration-300 hover:bg-primary/5 animate-in fade-in-20"
                          style={{ animationDelay: `${0.1 * index}s` }}
                        >
                          {editingUserId === user.id ? (
                            <TableCell colSpan={4}>
                              <Form {...editForm}>
                                <form
                                  id={`edit-form-${user.id}`}
                                  onSubmit={editForm.handleSubmit((values) =>
                                    setShowDialog({
                                      open: true,
                                      type: 'editUser',
                                      data: { values, userId: user.id },
                                    })
                                  )}
                                  className="space-y-6"
                                  role="form"
                                  aria-labelledby={`edit-user-form-${user.id}`}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                      control={editForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                                            Name
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              className="h-12 text-base font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="email"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                                            Email
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              className="h-12 text-base font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="flex space-x-4">
                                    <Button
                                      type="submit"
                                      className="h-12 px-6 text-sm font-semibold rounded-full bg-green-600 hover:bg-green-700 text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-300"
                                      aria-label="Save user changes"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
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
                              <TableCell className="text-base font-medium text-gray-900">
                                {user.name}
                              </TableCell>
                              <TableCell className="text-base font-medium text-gray-900">
                                {user.email}
                              </TableCell>
                              <TableCell className="text-base font-medium text-gray-900">
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-3">
                                  <Button
                                    className="h-10 px-4 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                                    onClick={() => startEditing(user)}
                                    aria-label={`Edit user ${user.name}`}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    className="h-10 px-4 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
                                    onClick={() =>
                                      setShowDialog({ open: true, type: 'deleteUser', data: user.id })
                                    }
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

        <Dialog open={showDialog.open} onOpenChange={() => setShowDialog({ open: false, type: '', data: null })}>
          <DialogContent
            className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
          >
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold text-primary tracking-tight">
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
                    onSubmit={addForm.handleSubmit((values) =>
                      setShowDialog({ open: true, type: 'addUser', data: values })
                    )}
                    className="space-y-6"
                    ref={formRef}
                    role="form"
                    aria-labelledby="add-user-form"
                  >
                    <FormField
                      control={addForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-12 text-base font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                              placeholder="Enter name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-12 text-base font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                              placeholder="Enter email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              className="h-12 text-base font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                              placeholder="Enter password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="flex flex-col sm:flex-row gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDialog({ open: false, type: '', data: null })}
                        className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                        aria-label="Cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
                        aria-label="Add user"
                      >
                        Add User
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              ) : (
                <p className="text-base text-gray-600 font-medium">
                  {showDialog.type === 'addUser' &&
                    `Add user ${showDialog.data?.name} with email ${showDialog.data?.email}?`}
                  {showDialog.type === 'editUser' &&
                    `Update user ${showDialog.data?.values.name} with email ${showDialog.data?.values.email}?`}
                  {showDialog.type === 'deleteUser' &&
                    'Are you sure you want to delete this user? This action cannot be undone.'}
                  {showDialog.type === 'updateStatus' &&
                    `Update order #${showDialog.data?.orderId} status to ${showDialog.data?.status
                      .replace('_', ' ')
                      .toUpperCase()}?`}
                </p>
              )}
            </div>
            {showDialog.type !== 'addUserForm' && (
              <DialogFooter className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog({ open: false, type: '', data: null })}
                  className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                  aria-label="Cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (showDialog.type === 'addUser') handleAddUser(showDialog.data);
                    if (showDialog.type === 'editUser')
                      handleEditUser(showDialog.data.values, showDialog.data.userId);
                    if (showDialog.type === 'deleteUser') handleDeleteUser(showDialog.data);
                    if (showDialog.type === 'updateStatus')
                      updateOrderStatus(showDialog.data.orderId, showDialog.data.status);
                  }}
                  className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
                  aria-label="Confirm action"
                >
                  Confirm
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}