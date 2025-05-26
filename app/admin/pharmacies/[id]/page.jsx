'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, Package, Pill, Edit, Trash2 } from 'lucide-react';

export default function PharmacyDetails() {
  const [pharmacy, setPharmacy] = useState(null);
  const [orders, setOrders] = useState({ orders: [], pagination: {} });
  const [medications, setMedications] = useState({ medications: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [medicationsPage, setMedicationsPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lga: '',
    state: '',
    phone: '',
    licenseNumber: '',
    status: 'pending',
    logoUrl: '',
    isActive: true,
  });
  const params = useParams();
  const pharmacyId = params.id;
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

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const pharmacyResponse = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!pharmacyResponse.ok) {
        if (pharmacyResponse.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch pharmacy details');
      }
      const pharmacyData = await pharmacyResponse.json();
      setPharmacy(pharmacyData.pharmacy);

      const ordersResponse = await fetch(`http://localhost:5000/api/admin/orders?pharmacyId=${pharmacyId}&page=${ordersPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!ordersResponse.ok) {
        if (ordersResponse.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);

      const medicationsResponse = await fetch(`http://localhost:5000/api/admin/medications?page=${medicationsPage}&limit=10&pharmacyId=${pharmacyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!medicationsResponse.ok) {
        if (medicationsResponse.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch medications');
      }
      const medicationsData = await medicationsResponse.json();
      setMedications(medicationsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    fetchPharmacyData();
  }, [pharmacyId, ordersPage, medicationsPage, authChecked]);

  const handleEdit = () => {
    setFormData({
      name: pharmacy.name,
      address: pharmacy.address,
      lga: pharmacy.lga,
      state: pharmacy.state,
      phone: pharmacy.phone,
      licenseNumber: pharmacy.licenseNumber,
      status: pharmacy.status,
      logoUrl: pharmacy.logoUrl || '',
      isActive: pharmacy.isActive,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
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
        throw new Error('Failed to update pharmacy');
      }
      setEditOpen(false);
      fetchPharmacyData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
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
        throw new Error('Failed to delete pharmacy');
      }
      router.push('/admin/pharmacies');
    } catch (err) {
      setError(err.message);
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
        <p className="text-muted-foreground ml-2">Loading pharmacy details...</p>
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

  if (!pharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="card bg-muted p-4 fade-in">
          <p className="text-muted-foreground">Pharmacy not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Pharmacy: {pharmacy.name}
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
            <Button
              onClick={() => router.push('/admin/pharmacies')}
              className="bg-muted hover:bg-muted/90 text-foreground"
            >
              Back to Pharmacies
            </Button>
          </div>
        </div>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="bg-muted">
            <TabsTrigger value="info" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Info
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Orders
            </TabsTrigger>
            <TabsTrigger value="medications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Medications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <Card className="card card-shadow fade-in">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                  <Building2 className="h-6 w-6 mr-2" />
                  Pharmacy Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2">
                <p className="text-muted-foreground"><strong>ID:</strong> {pharmacy.id}</p>
                <p className="text-muted-foreground"><strong>Name:</strong> {pharmacy.name}</p>
                <p className="text-muted-foreground"><strong>Address:</strong> {pharmacy.address}</p>
                <p className="text-muted-foreground"><strong>LGA:</strong> {pharmacy.lga}</p>
                <p className="text-muted-foreground"><strong>State:</strong> {pharmacy.state}</p>
                <p className="text-muted-foreground"><strong>Phone:</strong> {pharmacy.phone}</p>
                <p className="text-muted-foreground"><strong>License Number:</strong> {pharmacy.licenseNumber}</p>
                <p className="text-muted-foreground"><strong>Status:</strong> {pharmacy.status.toUpperCase()}</p>
                <p className="text-muted-foreground"><strong>Active:</strong> {pharmacy.isActive ? 'Yes' : 'No'}</p>
                <p className="text-muted-foreground"><strong>Created:</strong> {new Date(pharmacy.createdAt).toLocaleDateString()}</p>
                <p className="text-muted-foreground"><strong>Verified:</strong> {pharmacy.verifiedAt ? new Date(pharmacy.verifiedAt).toLocaleDateString() : '-'}</p>
                {pharmacy.logoUrl && (
                  <div>
                    <strong className="text-primary">Logo:</strong>
                    <img src={pharmacy.logoUrl} alt="Pharmacy Logo" className="h-16 mt-2 rounded shadow-sm" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders">
            <Card className="card card-shadow fade-in">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                  <Package className="h-6 w-6 mr-2" />
                  Orders
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
                    {orders.orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground text-center">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.orders.map((order, index) => (
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
                <div className="flex justify-between items-center mt-4">
                  <Button
                    disabled={ordersPage === 1}
                    onClick={() => setOrdersPage(ordersPage - 1)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground">
                    Page {orders.pagination.page || 1} of {orders.pagination.pages || 1}
                  </span>
                  <Button
                    disabled={ordersPage === orders.pagination.pages}
                    onClick={() => setOrdersPage(ordersPage + 1)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="medications">
            <Card className="card card-shadow fade-in">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                  <Pill className="h-6 w-6 mr-2" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary">ID</TableHead>
                      <TableHead className="text-primary">Name</TableHead>
                      <TableHead className="text-primary">Generic Name</TableHead>
                      <TableHead className="text-primary">Stock</TableHead>
                      <TableHead className="text-primary">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medications.medications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground text-center">
                          No medications found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      medications.medications.map((med, index) => {
                        const pm = med.pharmacyMedications.find((pm) => pm.pharmacy.id === parseInt(pharmacyId));
                        return (
                          <TableRow key={med.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                            <TableCell>{med.id}</TableCell>
                            <TableCell>{med.name}</TableCell>
                            <TableCell>{med.genericName || 'N/A'}</TableCell>
                            <TableCell>{pm ? pm.stock : '-'}</TableCell>
                            <TableCell>{pm ? `₦${pm.price.toLocaleString()}` : '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4">
                  <Button
                    disabled={medicationsPage === 1}
                    onClick={() => setMedicationsPage(medicationsPage - 1)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground">
                    Page {medications.pagination.page || 1} of {medications.pagination.pages || 1}
                  </span>
                  <Button
                    disabled={medicationsPage === medications.pagination.pages}
                    onClick={() => setMedicationsPage(medicationsPage + 1)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="card bg-card">
            <DialogHeader>
              <DialogTitle className="text-primary">Edit Pharmacy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-primary font-medium">Name</Label>
                <Input name="name" value={formData.name} onChange={handleInputChange} className="border-border" />
              </div>
              <div>
                <Label className="text-primary font-medium">Address</Label>
                <Input name="address" value={formData.address} onChange={handleInputChange} className="border-border" />
              </div>
              <div>
                <Label className="text-primary font-medium">LGA</Label>
                <Input name="lga" value={formData.lga} onChange={handleInputChange} className="border-border" />
              </div>
              <div>
                <Label className="text-primary font-medium">State</Label>
                <Input name="state" value={formData.state} onChange={handleInputChange} className="border-border" />
              </div>
              <div>
                <Label className="text-primary font-medium">Phone</Label>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} className="border-border" />
              </div>
              <div>
                <Label className="text-primary font-medium">License Number</Label>
                <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} className="border-border" />
              </div>
              <div>
                <Label className="text-primary font-medium">Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  className="border-border"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-medium">Logo URL</Label>
                <Input name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} className="border-border" />
              </div>
              <div>
                <label className="flex items-center">
                  <Input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-primary font-medium">Active</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border-border text-primary hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-success hover:bg-success/90 text-primary-foreground"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete this pharmacy? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-primary hover:bg-muted">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}