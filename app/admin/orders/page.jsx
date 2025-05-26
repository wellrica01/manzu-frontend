'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function Orders() {
  const [data, setData] = useState({ orders: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    patientIdentifier: '',
  });
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const query = new URLSearchParams({
        page,
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.patientIdentifier && { patientIdentifier: filters.patientIdentifier }),
      }).toString();
      const response = await fetch(`http://localhost:5000/api/admin/orders?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      fetchOrders();
    }
  }, [page, filters, authChecked]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === 'all' ? '' : value }));
    setPage(1);
  };

  if (!authChecked) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="card bg-destructive/10 border-l-4 border-destructive p-4 max-w-md mx-auto">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8">Orders</h1>
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary">Order List</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="cart">Cart</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pending_prescription">Pending Prescription</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Patient Identifier</label>
                <Input
                  value={filters.patientIdentifier}
                  onChange={(e) => handleFilterChange('patientIdentifier', e.target.value)}
                  placeholder="Filter by patient identifier"
                  className="border-border"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-primary/5">
                    <TableHead>ID</TableHead>
                    <TableHead>Patient Identifier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className="fade-in"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.patientIdentifier}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>₦{order.totalPrice.toLocaleString()}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="text-primary hover:bg-primary/10">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <Button
                disabled={page === data.pagination.pages}
                onClick={() => setPage(page + 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}