'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function Medications() {
  const [data, setData] = useState({ medications: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    name: '',
    genericName: '',
    category: '',
    prescriptionRequired: '',
  });
  
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    description: '',
    manufacturer: '',
    form: '',
    dosage: '',
    nafdacCode: '',
    prescriptionRequired: false,
    imageUrl: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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

 
  const fetchMedications = async () => {
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
        ...(filters.name && { name: filters.name }),
        ...(filters.genericName && { genericName: filters.genericName }),
        ...(filters.category && { category: filters.category }),
        ...(filters.prescriptionRequired && { prescriptionRequired: filters.prescriptionRequired }),
      }).toString();
      const response = await fetch(`http://localhost:5000/api/admin/medications?${query}`, {
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
        throw new Error('Failed to fetch medications');
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
    fetchMedications();
  }, [page, filters, authChecked]);

   if (!authChecked) {
    return null; // ⛔ Prevent rendering anything while checking auth
  }


  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === 'all' ? '' : value, }));
    setPage(1); // Reset to first page on filter change
  };
 
 const handleInputChange = (e) => {
 const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create medication');
      }
      setCreateOpen(false);
      setFormData({
        name: '',
        genericName: '',
        category: '',
        description: '',
        manufacturer: '',
        form: '',
        dosage: '',
        nafdacCode: '',
        prescriptionRequired: false,
        imageUrl: '',
      });
      fetchMedications();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Medications</h1>
        <Button onClick={() => setCreateOpen(true)}>Create Medication</Button>
      </div>      <Card>
        <CardHeader>
          <CardTitle>Medication List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Filter by name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Generic Name</label>
              <Input
                value={filters.genericName}
                onChange={(e) => handleFilterChange('genericName', e.target.value)}
                placeholder="Filter by generic name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                placeholder="Filter by category"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prescription Required</label>
              <Select
                value={filters.prescriptionRequired || 'all'}
                onValueChange={(value) => handleFilterChange('prescriptionRequired', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Prescription Required</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.medications.map((medication) => (
                <TableRow key={medication.id}>
                  <TableCell>{medication.id}</TableCell>
                  <TableCell>{medication.name}</TableCell>
                  <TableCell>{medication.genericName}</TableCell>
                  <TableCell>{medication.category || '-'}</TableCell>
                  <TableCell>{medication.prescriptionRequired ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{new Date(medication.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/admin/medications/${medication.id}`}>
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
    {/* Create Medication Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter medication name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Generic Name *</label>
              <Input
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
                placeholder="Enter generic name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <Input
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Enter category"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <Input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Manufacturer</label>
              <Input
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="Enter manufacturer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Form</label>
              <Input
                name="form"
                value={formData.form}
                onChange={handleInputChange}
                placeholder="Enter form (e.g., tablet)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Dosage</label>
              <Input
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                placeholder="Enter dosage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">NAFDAC Code</label>
              <Input
                name="nafdacCode"
                value={formData.nafdacCode}
                onChange={handleInputChange}
                placeholder="Enter NAFDAC code"
              />
            </div>
            <div>
              <label className="flex items-center">
                <Input
                  type="checkbox"
                  name="prescriptionRequired"
                  checked={formData.prescriptionRequired}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Prescription Required
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium">Image URL</label>
              <Input
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="Enter image URL"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}