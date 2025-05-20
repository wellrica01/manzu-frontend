'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false); // ✅ Block rendering until auth check completes

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login'); // 🔒 Redirect to login if not authenticated
    } else {
      setAuthChecked(true); // ✅ Only show content if authenticated
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
          // Unauthorized: redirect to login
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
    fetchOrders();
  }, [page, filters, authChecked]);

  
  if (!authChecked) {
    return null; // ⛔ Prevent rendering anything while checking auth
  }

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === 'all' ? '' : value, }));
    setPage(1); // Reset to first page on filter change
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
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
              <label className="block text-sm font-medium mb-1">Patient Identifier</label>
              <Input
                value={filters.patientIdentifier}
                onChange={(e) => handleFilterChange('patientIdentifier', e.target.value)}
                placeholder="Filter by patient identifier"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Patient Identifier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.patientIdentifier}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>₦{order.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {data.pagination.page} of {data.pagination.pages}
            </span>
            <Button
              disabled={page === data.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}