'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function PharmacyUsers() {
  const [data, setData] = useState({ users: [], pagination: {} });
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    role: '',
    email: '',
    pharmacyId: '',
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
 

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      console.log('Token in fetchPharmacies:', token); // ✅ now it's in scope
      const response = await fetch(`http://localhost:5000/api/admin/pharmacies/simple`, {
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
        throw new Error('Failed to fetch pharmacies');
      }
      const result = await response.json();
      console.log('Fetched pharmacies:', result.simplePharmacies); // Check the response
      setPharmacies(result.simplePharmacies);
    } catch (err) {
      console.error('Fetch pharmacies error:', err.message);
    }
  };

  const fetchUsers = async () => {
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
        ...(filters.role && { role: filters.role }),
        ...(filters.email && { email: filters.email }),
        ...(filters.pharmacyId && { pharmacyId: filters.pharmacyId }),
      }).toString();
      const response = await fetch(`http://localhost:5000/api/admin/pharmacy-users?${query}`, {
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
        throw new Error('Failed to fetch pharmacy users');
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
    fetchPharmacies();
    fetchUsers();
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
      <h1 className="text-3xl font-bold">Pharmacy Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pharmacy User List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <Select
                value={filters.role}
                onValueChange={(value) => handleFilterChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Filter by email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pharmacy</label>
              <Select
                value={filters.pharmacyId}
                onValueChange={(value) => handleFilterChange('pharmacyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pharmacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id.toString()}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.pharmacy.name}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/admin/pharmacy-users/${user.id}`}>
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