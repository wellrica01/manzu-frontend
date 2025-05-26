'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, LogOut } from 'lucide-react';

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
      const response = await fetch(`http://localhost:5000/api/pharmacy/medications`, {
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setForm({ ...form, medicationName: value, medicationId: '' });
    setShowDropdown(value.length > 0);
  };

  const handleSelectMedication = (med) => {
    setForm({ ...form, medicationId: med.id.toString(), medicationName: med.name });
    setSearchTerm(med.name);
    setShowDropdown(false);
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!form.medicationId) {
      setError('Please select a valid medication');
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`http://localhost:5000/api/pharmacy/medications`, {
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
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  const handleEditMedication = async (med) => {
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      const response = await fetch(`http://localhost:5000/api/pharmacy/medications`, {
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
    } catch (err) {
      setError(err.message);
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
      const response = await fetch(`http://localhost:5000/api/pharmacy/medications?medicationId=${med.medicationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medication');
      }
      fetchMedications();
    } catch (err) {
      setError(err.message);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Pharmacy Inventory
          </h1>
          <Button
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        <Card className="card card-hover mb-6 fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <Package className="h-6 w-6 mr-2" />
              Add New Medication
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddMedication} className="space-y-6">
              <div className="relative">
                <Label htmlFor="medicationName" className="text-primary font-medium">Medication</Label>
                <Input
                  id="medicationName"
                  name="medicationName"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-border"
                  placeholder="Type to search medications..."
                  autoComplete="off"
                />
                {showDropdown && filteredMedications.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg mt-1"
                  >
                    {filteredMedications.map((med) => (
                      <div
                        key={med.id}
                        className="px-4 py-2 hover:bg-primary/10 cursor-pointer text-foreground"
                        onClick={() => handleSelectMedication(med)}
                      >
                        {med.name}
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && filteredMedications.length === 0 && searchTerm && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 w-full bg-card border border-border rounded-lg shadow-lg mt-1 p-4 text-muted-foreground"
                  >
                    No medications found.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock" className="text-primary font-medium">Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    value={form.stock}
                    onChange={handleFormChange}
                    className="border-border"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-primary font-medium">Price (₦)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={handleFormChange}
                    className="border-border"
                    min="0"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add Medication
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <Package className="h-6 w-6 mr-2" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Loading inventory...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">Medication</TableHead>
                    <TableHead className="text-primary">Stock</TableHead>
                    <TableHead className="text-primary">Price (₦)</TableHead>
                    <TableHead className="text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        No medications in inventory.
                      </TableCell>
                    </TableRow>
                  ) : (
                    medications.map((med, index) => (
                      <TableRow key={`${med.pharmacyId}-${med.medicationId}`} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                        <TableCell>{med.name}</TableCell>
                        <TableCell>
                          {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                            <Input
                              name="stock"
                              type="number"
                              value={editForm.stock}
                              onChange={handleEditFormChange}
                              className="border-border w-20"
                              min="0"
                            />
                          ) : (
                            med.stock
                          )}
                        </TableCell>
                        <TableCell>
                          {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                            <Input
                              name="price"
                              type="number"
                              step="0.5"
                              value={editForm.price}
                              onChange={handleEditFormChange}
                              className="border-border w-full"
                              min="0"
                            />
                          ) : (
                            `₦${med.price.toLocaleString()}`
                          )}
                        </TableCell>
                        <TableCell>
                          {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleEditMedication(med)}
                                className="bg-success hover:bg-success/90 text-white"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingKey(null)}
                                className="bg-muted-500 hover:bg-gray-600 text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => startEditing(med)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteMedication(med)}
                                className="bg-destructive hover:bg-destructive/90 text-white"
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
            )}
            <Button
              className="bg-primary hover:bg-success/90 text-primary-foreground mt-4"
              onClick={() => router.push('/pharmacy/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}