'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Pill, Plus } from 'lucide-react';

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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthChecked(true);
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
        ...(filters.prescriptionRequired !== '' && { prescriptionRequired: filters.prescriptionRequired }),
      }).toString();
      const response = await fetch(`http://localhost:5000/api/admin/medications?${query}`, {
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
    if (!authChecked) return;
    fetchMedications();
  }, [page, filters, authChecked]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === 'all' ? '' : value }));
    setPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.genericName) {
      setFormError('Name and Generic Name are required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
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

  if (!authChecked) {
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
        <p className="text-muted-foreground ml-2">Loading medications...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Medications
          </h1>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Medication
            </Button>
            <Button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-muted hover:bg-muted/90 text-foreground"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Card className="card card-shadow fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <Pill className="h-6 w-6 mr-2" />
              Medication List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <Label className="block text-sm font-medium text-primary mb-1">Name</Label>
                <Input
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  placeholder="Filter by name"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary mb-1">Generic Name</Label>
                <Input
                  value={filters.genericName}
                  onChange={(e) => handleFilterChange('genericName', e.target.value)}
                  placeholder="Filter by generic name"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary mb-1">Category</Label>
                <Input
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  placeholder="Filter by category"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary mb-1">Prescription Required</Label>
                <Select
                  value={filters.prescriptionRequired || 'all'}
                  onValueChange={(value) => handleFilterChange('prescriptionRequired', value)}
                >
                  <SelectTrigger className="border-border">
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
                  <TableHead className="text-primary">ID</TableHead>
                  <TableHead className="text-primary">Name</TableHead>
                  <TableHead className="text-primary">Generic Name</TableHead>
                  <TableHead className="text-primary">Category</TableHead>
                  <TableHead className="text-primary">Prescription Required</TableHead>
                  <TableHead className="text-primary">Created At</TableHead>
                  <TableHead className="text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.medications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-center">
                      No medications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.medications.map((medication, index) => (
                    <TableRow key={medication.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                      <TableCell>{medication.id}</TableCell>
                      <TableCell>{medication.name}</TableCell>
                      <TableCell>{medication.genericName || 'N/A'}</TableCell>
                      <TableCell>{medication.category || '-'}</TableCell>
                      <TableCell>{medication.prescriptionRequired ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{new Date(medication.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/admin/medications/${medication.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-primary hover:bg-muted"
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {data.pagination.page || 1} of {data.pagination.pages || 1}
              </span>
              <Button
                disabled={page === data.pagination.pages}
                onClick={() => setPage(page + 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="card bg-card">
            <DialogHeader>
              <DialogTitle className="text-primary">Create Medication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {formError && (
                <div className="card bg-destructive/10 border-l-4 border-destructive p-2">
                  <p className="text-destructive text-sm">{formError}</p>
                </div>
              )}
              <div>
                <Label className="block text-sm font-medium text-primary">Name *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter medication name"
                  required
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">Generic Name *</Label>
                <Input
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleInputChange}
                  placeholder="Enter generic name"
                  required
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">Category</Label>
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">Description</Label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">Manufacturer</Label>
                <Input
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  placeholder="Enter manufacturer"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">Form</Label>
                <Input
                  name="form"
                  value={formData.form}
                  onChange={handleInputChange}
                  placeholder="Enter form (e.g., tablet)"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">Dosage</Label>
                <Input
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  placeholder="Enter dosage"
                  className="border-border"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">NAFDAC Code</Label>
                <Input
                  name="nafdacCode"
                  value={formData.nafdacCode}
                  onChange={handleInputChange}
                  placeholder="Enter NAFDAC code"
                  className="border-border"
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
                  <span className="text-primary font-medium">Prescription Required</span>
                </label>
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary">Image URL</Label>
                <Input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="Enter image URL"
                  className="border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={submitting}
                className="border-border text-primary hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-success hover:bg-success/90 text-primary-foreground"
              >
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}