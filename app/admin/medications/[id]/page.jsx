'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

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
  const [authChecked, setAuthChecked] = useState(false); // ✅ Block rendering until auth check completes

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login'); // 🔒 Redirect to login if not authenticated
    } else {
      setAuthChecked(true); // ✅ Only show content if authenticated
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
          // Unauthorized: redirect to login
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
    fetchMedication();
  }, [medicationId, authChecked]);

  
  if (!authChecked) {
    return null; // ⛔ Prevent rendering anything while checking auth
  }


  const handleEdit = () => {
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
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
          // Unauthorized: redirect to login
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
          // Unauthorized: redirect to login
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

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  if (!medication) return <div className="text-center p-6">Medication not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Medication: {medication.name}</h1>
        <div className="space-x-2">
          <Button onClick={handleEdit}>Edit</Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
          <Link href="/admin/medications">
            <Button variant="outline">Back to Medications</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Medication Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>ID:</strong> {medication.id}</p>
          <p><strong>Name:</strong> {medication.name}</p>
          <p><strong>Generic Name:</strong> {medication.genericName}</p>
          <p><strong>Category:</strong> {medication.category || '-'}</p>
          <p><strong>Description:</strong> {medication.description || '-'}</p>
          <p><strong>Manufacturer:</strong> {medication.manufacturer || '-'}</p>
          <p><strong>Form:</strong> {medication.form || '-'}</p>
          <p><strong>Dosage:</strong> {medication.dosage || '-'}</p>
          <p><strong>NAFDAC Code:</strong> {medication.nafdacCode || '-'}</p>
          <p><strong>Prescription Required:</strong> {medication.prescriptionRequired ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> {new Date(medication.createdAt).toLocaleDateString()}</p>
          {medication.imageUrl && (
            <div>
              <strong>Image:</strong>
              <img src={medication.imageUrl} alt="Medication Image" className="h-24 mt-2" />
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Associated Pharmacies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pharmacy ID</TableHead>
                <TableHead>Pharmacy Name</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medication.pharmacyMedications.map((pm) => (
                <TableRow key={pm.pharmacy.id}>
                  <TableCell>{pm.pharmacy.id}</TableCell>
                  <TableCell>{pm.pharmacy.name}</TableCell>
                  <TableCell>{pm.stock}</TableCell>
                  <TableCell>₦{pm.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
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
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medication? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}