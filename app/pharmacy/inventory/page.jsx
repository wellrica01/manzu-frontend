'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Package, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';

export default function PharmacyInventory() {
  const [medications, setMedications] = useState([]);
  const [availableMedications, setAvailableMedications] = useState([]);
  const [form, setForm] = useState({ medicationId: '', medicationName: '', stock: '', price: '' });
  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({ stock: '', price: '' });
  const [error, setError] = useState(null);
  const [pharmacyId, setPharmacyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState({ open: false, type: '', data: null });
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    if (!token) {
      router.replace('/pharmacy/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setPharmacyId(decoded.pharmacyId);
    } catch (err) {
      localStorage.removeItem('pharmacyToken');
      router.replace('/pharmacy/login');
    }
  }, [router]);

  const fetchMedications = async () => {
    if (!pharmacyId) return;
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch medications');
      }
      const data = await response.json();
      setMedications(data.medications);
      setAvailableMedications(data.availableMedications);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [pharmacyId]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value.trim() });
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value.trim() });
  };

  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
    setForm({ ...form, medicationName: value, medicationId: '' });
    setShowDropdown(value.length > 0);
  }, 300);

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value.trim());
  };

  const handleSelectMedication = (med) => {
    setForm({ ...form, medicationId: med.id.toString(), medicationName: med.name });
    setSearchTerm(med.name);
    setShowDropdown(false);
  };

  const handleAddMedication = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.medicationId) {
      setError('Please select a valid medication');
      toast.error('Please select a valid medication', { duration: 4000 });
      return;
    }
    if (parseInt(form.stock) < 0 || parseFloat(form.price) < 0) {
      setError('Stock and price must be non-negative');
      toast.error('Stock and price must be non-negative', { duration: 4000 });
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, pharmacyId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add medication');
      }

      setForm({ medicationId: '', medicationName: '', stock: '', price: '' });
      setSearchTerm('');
      setShowDropdown(false);
      fetchMedications();
      toast.success('Medication added successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_medication', { medicationId: form.medicationId });
      }
    }     catch (err) {

    setError(err.message);
    toast.error(err.message, { duration: 4000 });

    if (err.status === 401) {
      localStorage.removeItem('pharmacyToken');
      router.replace('/pharmacy/login');
    }
  }
  };

  const handleEditMedication = async (med) => {
    if (parseInt(editForm.stock) < 0 || parseFloat(editForm.price) < 0) {
      setError('Stock and price must be non-negative');
      toast.error('Stock and price must be non-negative', { duration: 4000 });
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pharmacyId, medicationId: med.medicationId, ...editForm }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update medication');
      }
      setEditingKey(null);
      setEditForm({ stock: '', price: '' });
      fetchMedications();
      toast.success('Medication updated successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'edit_medication', { medicationId: med.medicationId });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const handleDeleteMedication = async (med) => {
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications?medicationId=${med.medicationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medication');
      }
      fetchMedications();
      toast.success('Medication deleted successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'delete_medication', { medicationId: med.medicationId });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const startEditing = (med) => {
    setEditingKey(`${med.pharmacyId}-${med.medicationId}`);
    setEditForm({ stock: med.stock.toString(), price: med.price.toString() });
  };

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    router.push('/pharmacy/login');
  };

  const filteredMedications = availableMedications.filter(med =>
    med.name.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!pharmacyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Pharmacy Inventory</h1>
        <Button
          onClick={handleLogout}
          className="bg-destructive hover:bg-destructive/90 text-primary-foreground text-sm py-2 px-6"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      {error && (
        <div className="card bg-destructive/10 border-l-4 border-destructive p-3" role="alert">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Add New Medication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowDialog({ open: true, type: 'addMedication', data: null });
            }}
            className="space-y-4"
            role="form"
            aria-labelledby="add-medication-form"
          >
            <div className="relative">
              <Label htmlFor="medicationName" className="text-primary font-medium text-sm">Medication</Label>
              <Input
                id="medicationName"
                name="medicationName"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="border-border text-sm"
                placeholder="Type to search medications..."
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="medication-dropdown"
              />
              {showDropdown && filteredMedications.length > 0 && (
                <div
                  ref={dropdownRef}
                  id="medication-dropdown"
                  className="absolute z-10 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg mt-1"
                  role="listbox"
                >
                  {filteredMedications.map((med) => (
                    <div
                      key={med.id}
                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer text-foreground text-sm"
                      onClick={() => handleSelectMedication(med)}
                      role="option"
                      aria-selected={form.medicationId === med.id.toString()}
                    >
                      {med.name}
                    </div>
                  ))}
                </div>
              )}
              {showDropdown && filteredMedications.length === 0 && searchTerm && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 w-full bg-card border border-border rounded-lg shadow-lg mt-1 p-4 text-muted-foreground text-sm"
                >
                  No medications found.
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock" className="text-primary font-medium text-sm">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={handleFormChange}
                  className="border-border text-sm"
                  min="0"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-primary font-medium text-sm">Price (₦)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={handleFormChange}
                  className="border-border text-sm"
                  min="0"
                  required
                  aria-required="true"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
              aria-label="Add medication"
            >
              Add Medication
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-sm mt-2">Loading inventory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary text-sm">Medication</TableHead>
                    <TableHead className="text-primary text-sm">Stock</TableHead>
                    <TableHead className="text-primary text-sm">Price (₦)</TableHead>
                    <TableHead className="text-primary text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                        No medications in inventory.
                      </TableCell>
                    </TableRow>
                  ) : (
                    medications.map((med, index) => (
                      <TableRow
                        key={`${med.pharmacyId}-${med.medicationId}`}
                        className="transition-opacity duration-300"
                        style={{ animation: 'fadeIn 0.5s ease-in', animationDelay: `${0.1 * index}s` }}
                      >
                        <TableCell className="text-sm truncate max-w-[200px]">{med.name}</TableCell>
                        <TableCell>
                          {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                            <Input
                              name="stock"
                              type="number"
                              value={editForm.stock}
                              onChange={handleEditFormChange}
                              className="border-border w-20 text-sm"
                              min="0"
                              aria-label="Edit stock"
                            />
                          ) : (
                            <span className="text-sm">{med.stock}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                            <Input
                              name="price"
                              type="number"
                              step="0.01"
                              value={editForm.price}
                              onChange={handleEditFormChange}
                              className="border-border w-32 text-sm"
                              min="0"
                              aria-label="Edit price"
                            />
                          ) : (
                            <span className="text-sm">₦{med.price.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => setShowDialog({ open: true, type: 'editMedication', data: med })}
                                className="bg-success hover:bg-success/90 text-primary-foreground text-sm py-1 px-4"
                                aria-label={`Save changes for ${med.name}`}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingKey(null)}
                                variant="outline"
                                className="border-border text-primary hover:bg-muted text-sm py-1 px-4"
                                aria-label="Cancel editing"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => startEditing(med)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-1 px-4"
                                aria-label={`Edit ${med.name}`}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => setShowDialog({ open: true, type: 'deleteMedication', data: med })}
                                className="bg-destructive hover:bg-destructive/90 text-primary-foreground text-sm py-1 px-4"
                                aria-label={`Delete ${med.name}`}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6 mt-4"
            onClick={() => router.push('/pharmacy/dashboard')}
            aria-label="Back to dashboard"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
  <Dialog open={showDialog.open} onOpenChange={() => setShowDialog({ open: false, type: '', data: null })}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-primary">
          {showDialog.type === 'addMedication' && 'Confirm Add Medication'}
          {showDialog.type === 'editMedication' && 'Confirm Edit Medication'}
          {showDialog.type === 'deleteMedication' && 'Confirm Delete Medication'}
        </DialogTitle>
      </DialogHeader>

      {/* ✅ Accessibility fix: Wrap description in DialogDescription */}
      <DialogDescription>
        <p className="text-sm text-foreground py-4">
          {showDialog.type === 'addMedication' &&
            `Add ${form.medicationName} with stock ${form.stock} and price ₦${form.price}?`}
          {showDialog.type === 'editMedication' &&
            `Update ${showDialog.data?.name} with stock ${editForm.stock} and price ₦${editForm.price}?`}
          {showDialog.type === 'deleteMedication' &&
            'Are you sure you want to delete this medication? This action cannot be undone.'}
        </p>
      </DialogDescription>

      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => setShowDialog({ open: false, type: '', data: null })}
          className="w-full sm:w-auto text-sm"
          aria-label="Cancel"
        >
          Cancel
        </Button>

        <Button
          onClick={() => {
            if (showDialog.type === 'addMedication') {
              handleAddMedication();
            } else if (showDialog.type === 'editMedication') {
              handleEditMedication(showDialog.data);
            } else if (showDialog.type === 'deleteMedication') {
              handleDeleteMedication(showDialog.data);
            }
          }}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
          aria-label="Confirm"
        >
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

    </div>
  );
}