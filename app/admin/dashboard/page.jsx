'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, LogOut, Shield, Package, Users, Pill, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.adminId;
      if (!userId || !['admin', 'support'].includes(decoded.role)) {
        localStorage.removeItem('adminToken');
        router.replace('/admin/login');
        return;
      }
      setAdminId(userId);
      setAdminRole(decoded.role);
    } catch (err) {
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

  if (!adminId || !adminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground ml-2">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="card bg-destructive/10 border-l-4 border-destructive p-4 fade-in">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Admin Dashboard
          </h1>
          <Button
            onClick={handleLogout}
            className="bg-destructive hover:bg-red-600 text-primary-foreground"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="card-wrapper card-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center text-lg font-semibold text-primary">
                <Shield className="h-5 w-5 mr-2" />
                Pharmacies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{data.pharmacies.total}</p>
              <p className="text-sm text-muted-foreground">Verified: {data.pharmacies.count}</p>
            </CardContent>
          </Card>
          <Card className="card-wrapper card-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center text-lg font-semibold text-primary">
                <Pill className="h-5 w-5 mr-2" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{data.medications.total}</p>
            </CardContent>
          </Card>
          <Card className="card-wrapper card-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center text-lg font-semibold text-primary">
                <FileText className="h-5 w-5 mr-2" />
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{data.prescriptions.total}</p>
              <p className="text-sm text-muted-foreground">Pending: {data.prescriptions.pending}</p>
            </CardContent>
          </Card>
          <Card className="card-wrapper card-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center text-lg font-semibold text-primary">
                <Users className="h-5 w-5 mr-2" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{data.users.total}</p>
            </CardContent>
          </Card>
          <Card className="card-wrapper card-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center text-lg font-semibold text-primary">
                <Package className="h-5 w-5 mr-2" />
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{data.orders.total}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="card-wrapper card-shadow fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID</TableHead>
                  <TableHead className="text-primary">Tracking Code</TableHead>
                  <TableHead className="text-primary">Patient</TableHead>
                  <TableHead className="text-primary">Total Price</TableHead>
                  <TableHead className="text-primary">Status</TableHead>
                  <TableHead className="text-primary">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.recent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      No recent orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.orders.recent.map((order, index) => (
                    <TableRow key={order.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.trackingCode}</TableCell>
                      <TableCell>{order.patientIdentifier}</TableCell>
                      <TableCell>₦{order.totalPrice.toLocaleString()}</TableCell>
                      <TableCell>{order.status.replace('_', ' ').toUpperCase()}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button
            onClick={() => router.push('/admin/admin-users')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Manage Admin Users
          </Button>
          <Button
            onClick={() => router.push('/admin/pharmacy-users')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Manage Pharmacy Users
          </Button>
        </div>
      </div>
    </div>
  );
}