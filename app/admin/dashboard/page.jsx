'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    console.log('Found token:', token);
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.adminId;
      // Validate token is for AdminUser
      console.log("Decoded token:", decoded);
      if (!userId || !['admin', 'support'].includes(decoded.role)) {
        console.error('Invalid token: Not an AdminUser');
        localStorage.removeItem('adminToken');
        router.replace('/admin/login');
        return;
      }
      setAdminId(userId);
      setAdminRole(decoded.role);
    } catch (err) {
      console.error('Invalid token:', err);
      localStorage.removeItem('adminToken');
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    if (!adminId || !adminRole) return;

    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.replace('/admin/login');
          return;
        }
        const response = await fetch('http://localhost:5000/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result.summary);
      } catch (err) {
        console.error('Fetch dashboard error:', err.message);
        setError(err.message);
        if (err.message.includes('Invalid token') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [adminId, adminRole, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  // Don't render until token is validated
  if (!adminId || !adminRole) {
    return null; // or a loading spinner
  }

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-800">Admin Dashboard</h1>
        <Button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Logout
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800">Pharmacies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.pharmacies.total}</p>
            <p className="text-sm text-gray-500">Verified: {data.pharmacies.verified}</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800">Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.medications.total}</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800">Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.prescriptions.total}</p>
            <p className="text-sm text-gray-500">Pending: {data.prescriptions.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.users.total}</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.orders.total}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="text-indigo-800">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-indigo-800">ID</TableHead>
                <TableHead className="text-indigo-800">Tracking Code</TableHead>
                <TableHead className="text-indigo-800">Patient</TableHead>
                <TableHead className="text-indigo-800">Total Price</TableHead>
                <TableHead className="text-indigo-800">Status</TableHead>
                <TableHead className="text-indigo-800">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.recent.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.trackingCode}</TableCell>
                  <TableCell>{order.patientIdentifier}</TableCell>
                  <TableCell>₦{order.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex space-x-4">
        <Button
          onClick={() => router.push('/admin/admin-users')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Manage Admin Users
        </Button>
        <Button
          onClick={() => router.push('/admin/pharmacy-users')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Manage Pharmacy Users
        </Button>
        <Button
          onClick={() => router.push('/')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}