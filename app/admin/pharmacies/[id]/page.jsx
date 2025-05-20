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

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch pharmacy details
      const pharmacyResponse = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!pharmacyResponse.ok) {
        throw new Error('Failed to fetch pharmacy details');
      }
      const pharmacyData = await pharmacyResponse.json();
      setPharmacy(pharmacyData.pharmacy);

      // Fetch orders
      const ordersResponse = await fetch(`http://localhost:5000/api/admin/orders?pharmacyId=${pharmacyId}&page=${ordersPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);

      // Fetch medications
        const medicationsResponse = await fetch(`http://localhost:5000/api/admin/medications?page=${medicationsPage}&limit=10&pharmacyId=${pharmacyId}`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        if (!medicationsResponse.ok) {
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
    fetchPharmacyData();
  }, [pharmacyId, ordersPage, medicationsPage]);

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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
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

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  if (!pharmacy) return <div className="text-center p-6">Pharmacy not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pharmacy: {pharmacy.name}</h1>
        <div className="space-x-2">
          <Button onClick={handleEdit}>Edit</Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>ID:</strong> {pharmacy.id}</p>
              <p><strong>Name:</strong> {pharmacy.name}</p>
              <p><strong>Address:</strong> {pharmacy.address}</p>
              <p><strong>LGA:</strong> {pharmacy.lga}</p>
              <p><strong>State:</strong> {pharmacy.state}</p>
              <p><strong>Phone:</strong> {pharmacy.phone}</p>
              <p><strong>License Number:</strong> {pharmacy.licenseNumber}</p>
              <p><strong>Status:</strong> {pharmacy.status}</p>
              <p><strong>Active:</strong> {pharmacy.isActive ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {new Date(pharmacy.createdAt).toLocaleDateString()}</p>
              <p><strong>Verified:</strong> {pharmacy.verifiedAt ? new Date(pharmacy.verifiedAt).toLocaleDateString() : '-'}</p>
              {pharmacy.logoUrl && (
                <div>
                  <strong>Logo:</strong>
                  <img src={pharmacy.logoUrl} alt="Pharmacy Logo" className="h-16 mt-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tracking Code</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.orders.map((order) => (
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
              <div className="flex justify-between mt-4">
                <Button
                  disabled={ordersPage === 1}
                  onClick={() => setOrdersPage(ordersPage - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {orders.pagination.page} of {orders.pagination.pages}
                </span>
                <Button
                  disabled={ordersPage === orders.pagination.pages}
                  onClick={() => setOrdersPage(ordersPage + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Medications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.medications.map((med) => {
                    const pm = med.pharmacyMedications.find((pm) => pm.pharmacy.id === parseInt(pharmacyId));
                    return (
                      <TableRow key={med.id}>
                        <TableCell>{med.id}</TableCell>
                        <TableCell>{med.name}</TableCell>
                        <TableCell>{med.genericName}</TableCell>
                        <TableCell>{pm.stock}</TableCell>
                        <TableCell>₦{pm.price.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-between mt-4">
                <Button
                  disabled={medicationsPage === 1}
                  onClick={() => setMedicationsPage(medicationsPage - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {medications.pagination.page} of {medications.pagination.pages}
                </span>
                <Button
                  disabled={medicationsPage === medications.pagination.pages}
                  onClick={() => setMedicationsPage(medicationsPage + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pharmacy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <Input name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">LGA</label>
              <Input name="lga" value={formData.lga} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <Input name="state" value={formData.state} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <Input name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">License Number</label>
              <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded p-2">
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Logo URL</label>
              <Input name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} />
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
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pharmacy? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}