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
   <div className="space-y-12 min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
  <div className="container mx-auto max-w-7xl">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
        Manage Your 
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse"> Inventory</span>
      </h1>
      <Button
        onClick={handleLogout}
        className="h-12 px-6 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5 mr-2" aria-hidden="true" />
        Logout
      </Button>
    </div>
    {error && (
      <div
        className="bg-red-50/90 border-l-4 border-red-500 p-4 rounded-xl animate-in fade-in-20 duration-300"
        role="alert"
      >
        <p className="text-red-600 text-base font-medium">{error}</p>
      </div>
    )}
    <Card className="my-6 shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(59,130,246,0.3)]">
      <div className="absolute top-0 left-0 w-16 h-16 bg-primary/25 rounded-br-full opacity-70" />
      <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
          <Package className="h-8 w-8 mr-3 text-primary/90 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
          Add New Medication
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowDialog({ open: true, type: 'addMedication', data: null });
          }}
          className="space-y-6"
          role="form"
          aria-labelledby="add-medication-form"
        >
          <div className="relative">
            <Label htmlFor="medicationName" className="text-primary font-semibold text-sm uppercase tracking-wider">Medication</Label>
            <Input
              id="medicationName"
              name="medicationName"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
              placeholder="Type to search medications..."
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="medication-dropdown"
            />
            {showDropdown && filteredMedications.length > 0 && (
              <div
                ref={dropdownRef}
                id="medication-dropdown"
                className="absolute z-20 w-full max-h-60 overflow-y-auto bg-white/95 backdrop-blur-md border border-gray-100/30 rounded-xl shadow-lg mt-2 animate-in fade-in-20 duration-200"
                role="listbox"
              >
                {filteredMedications.map((med) => (
                  <div
                    key={med.id}
                    className="px-4 py-3 hover:bg-primary/10 cursor-pointer text-gray-900 text-base font-medium transition-all duration-200"
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
                className="absolute z-20 w-full bg-white/95 backdrop-blur-md border border-gray-100/30 rounded-xl shadow-lg mt-2 p-4 text-gray-600 text-base font-medium animate-in fade-in-20 duration-200"
              >
                No medications found.
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="stock" className="text-primary font-semibold text-sm uppercase tracking-wider">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleFormChange}
                className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                min="0"
                required
                aria-required="true"
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-primary font-semibold text-sm uppercase tracking-wider">Price (₦)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={handleFormChange}
                className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                min="0"
                required
                aria-required="true"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
            aria-label="Add medication"
          >
            Add Medication
          </Button>
        </form>
      </CardContent>
    </Card>
    <Card className="my-6 shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(59,130,246,0.3)]">
      <div className="absolute top-0 left-0 w-16 h-16 bg-primary/25 rounded-br-full opacity-70" />
      <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
          <Package className="h-8 w-8 mr-3 text-primary/90 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
          Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" aria-hidden="true" />
            <p className="text-gray-600 text-lg font-medium mt-4">Loading inventory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/70 border-b border-gray-100/20">
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Medication</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Stock</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Price (₦)</TableHead>
                  <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-gray-500 text-center text-lg font-medium py-8">
                      No medications in inventory.
                    </TableCell>
                  </TableRow>
                ) : (
                  medications.map((med, index) => (
                    <TableRow
                      key={`${med.pharmacyId}-${med.medicationId}`}
                      className="border-b border-gray-100/10 transition-all duration-300 hover:bg-primary/10 animate-in fade-in-20"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <TableCell className="text-base font-medium text-gray-900 py-4 truncate max-w-[250px]" title={med.name}>
                        {med.name}
                      </TableCell>
                      <TableCell className="py-4">
                        {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                          <Input
                            name="stock"
                            type="number"
                            value={editForm.stock}
                            onChange={handleEditFormChange}
                            className="h-10 w-24 rounded-xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] text-base"
                            min="0"
                            aria-label={`Edit stock for ${med.name}`}
                          />
                        ) : (
                          <span className="text-base font-medium text-gray-900">{med.stock}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                          <Input
                            name="price"
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={handleEditFormChange}
                            className="h-10 w-32 rounded-xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] text-base"
                            min="0"
                            aria-label={`Edit price for ${med.name}`}
                          />
                        ) : (
                          <span className="text-base font-medium text-gray-900">
                            {med.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => setShowDialog({ open: true, type: 'editMedication', data: med })}
                              className="h-10 px-4 text-sm font-semibold rounded-full bg-green-600 hover:bg-green-700 text-white hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all duration-300"
                              aria-label={`Save changes for ${med.name}`}
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => setEditingKey(null)}
                              variant="outline"
                              className="h-10 px-4 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                              aria-label="Cancel editing"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => startEditing(med)}
                              className="h-10 px-4 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                              aria-label={`Edit ${med.name}`}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => setShowDialog({ open: true, type: 'deleteMedication', data: med })}
                              className="h-10 px-4 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
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
          className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 mt-6"
          onClick={() => router.push('/pharmacy/dashboard')}
          aria-label="Back to dashboard"
        >
          Back to Dashboard
        </Button>
      </CardContent>
    </Card>
    <Dialog open={showDialog.open} onOpenChange={() => setShowDialog({ open: false, type: '', data: null })}>
      <DialogContent className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300">
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-primary tracking-tight">
            {showDialog.type === 'addMedication' && 'Confirm Add Medication'}
            {showDialog.type === 'editMedication' && 'Confirm Edit Medication'}
            {showDialog.type === 'deleteMedication' && 'Confirm Delete Medication'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-base text-gray-600 font-medium py-4">
          {showDialog.type === 'addMedication' &&
            `Add ${form.medicationName} with stock ${form.stock} and price ₦${form.price}?`}
          {showDialog.type === 'editMedication' &&
            `Update ${showDialog.data?.name} with stock ${editForm.stock} and price ₦${editForm.price}?`}
          {showDialog.type === 'deleteMedication' &&
            'Are you sure you want to delete this medication? This action cannot be undone.'}
        </p>
        <DialogFooter className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={() => setShowDialog({ open: false, type: '', data: null })}
            className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
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
            className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
            aria-label="Confirm"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</div>
  );
}