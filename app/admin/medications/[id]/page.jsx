'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Pill, Edit, Trash2 } from 'lucide-react';

export default function MedicationDetails() {
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
  const params = useParams();
  const medicationId = params.id;
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

  const fetchMedication = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/medications/${medicationId}`, {
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
        throw new Error('Failed to fetch medication');
      }
      const result = await response.json();
      setMedication(result.medication);
      setFormData({
        name: result.medication.name,
        genericName: result.medication.genericName,
        category: result.medication.category || '',
        description: result.medication.description || '',
        manufacturer: result.medication.manufacturer || '',
        form: result.medication.form || '',
        dosage: result.medication.dosage || '',
        nafdacCode: result.medication.nafdacCode || '',
        prescriptionRequired: result.medication.prescriptionRequired,
        imageUrl: result.medication.imageUrl || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    fetchMedication();
  }, [medicationId, authChecked]);

  const handleEdit = () => {
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
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
      const response = await fetch(`http://localhost:5000/api/admin/medications/${medicationId}`, {
        method: 'PATCH',
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
        throw new Error(errorData.message || 'Failed to update medication');
      }
      setEditOpen(false);
      fetchMedication();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/medications/${medicationId}`, {
        method: 'DELETE',
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
        throw new Error('Failed to delete medication');
      }
      router.push('/admin/medications');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
        <p className="text-muted-foreground ml-2">Loading medication details...</p>
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

  if (!medication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="card bg-muted p-4 fade-in">
          <p className="text-muted-foreground">Medication not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Medication: {medication.name}
          </h1>
          <div className="flex space-x-2">
            <Button
              onClick={handleEdit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setDeleteOpen(true)}
              className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete
            </Button>
            <Link href="/admin/medications">
              <Button
                className="bg-muted hover:bg-muted/90 text-foreground"
              >
                Back to Medications
              </Button>
            </Link>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="card card-shadow fade-in">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                <Pill className="h-6 w-6 mr-2" />
                Medication Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <p className="text-muted-foreground"><strong>ID:</strong> {medication.id}</p>
              <p className="text-muted-foreground"><strong>Name:</strong> {medication.name}</p>
              <p className="text-muted-foreground"><strong>Generic Name:</strong> {medication.genericName}</p>
              <p className="text-muted-foreground"><strong>Category:</strong> {medication.category || '-'}</p>
              <p className="text-muted-foreground"><strong>Description:</strong> {medication.description || '-'}</p>
              <p className="text-muted-foreground"><strong>Manufacturer:</strong> {medication.manufacturer || '-'}</p>
              <p className="text-muted-foreground"><strong>Form:</strong> {medication.form || '-'}</p>
              <p className="text-muted-foreground"><strong>Dosage:</strong> {medication.dosage || '-'}</p>
              <p className="text-muted-foreground"><strong>NAFDAC Code:</strong> {medication.nafdacCode || '-'}</p>
              <p className="text-muted-foreground"><strong>Prescription Required:</strong> {medication.prescriptionRequired ? 'Yes' : 'No'}</p>
              <p className="text-muted-foreground"><strong>Created:</strong> {new Date(medication.createdAt).toLocaleDateString()}</p>
              {medication.imageUrl && (
                <div>
                  <strong className="text-primary">Image:</strong>
                  <img src={medication.imageUrl} alt="Medication Image" className="h-24 mt-2 rounded shadow-sm" />
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="card card-shadow fade-in">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                <Pill className="h-6 w-6 mr-2" />
                Associated Pharmacies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">Pharmacy ID</TableHead>
                    <TableHead className="text-primary">Pharmacy Name</TableHead>
                    <TableHead className="text-primary">Stock</TableHead>
                    <TableHead className="text-primary">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medication.pharmacyMedications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        No pharmacies associated.
                      </TableCell>
                    </TableRow>
                  ) : (
                    medication.pharmacyMedications.map((pm, index) => (
                      <TableRow key={pm.pharmacy.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                        <TableCell>{pm.pharmacy.id}</TableCell>
                        <TableCell>{pm.pharmacy.name}</TableCell>
                        <TableCell>{pm.stock}</TableCell>
                        <TableCell>₦{pm.price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="card bg-card">
            <DialogHeader>
              <DialogTitle className="text-primary">Edit Medication</DialogTitle>
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
                <Label className="block text-sm font-medium">Image URL</Label>
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
                onClick={() => setEditOpen(false)}
                disabled={submitting}
                className="border-border text-primary hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="bg-success hover:bg-success/90 text-primary-foreground"
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete this medication? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={submitting}
                className="border-border text-primary hover:bg-muted"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={submitting}
                className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}