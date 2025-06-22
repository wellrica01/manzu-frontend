'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Package, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';

export default function LabInventory() {
  const [tests, setTests] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [form, setForm] = useState({ testId: '', testName: '', availability: false, price: '' });
  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({ availability: false, price: '' });
  const [error, setError] = useState(null);
  const [labId, setLabId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState({ open: false, type: '', data: null });
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('labToken');
    if (!token) {
      router.replace('/lab/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setLabId(decoded.labId);
    } catch (err) {
      localStorage.removeItem('labToken');
      router.replace('/lab/login');
    }
  }, [router]);

  const fetchTests = async () => {
    if (!labId) return;
    try {
      setError(null);
      const token = localStorage.getItem('labToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lab/tests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tests');
      }
      const data = await response.json();
      setTests(data.tests);
      setAvailableTests(data.availableTests);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('labToken');
        router.replace('/lab/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [labId]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value.trim() });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({ ...editForm, [name]: type === 'checkbox' ? checked : value.trim() });
  };

  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
    setForm({ ...form, testName: value, testId: '' });
    setShowDropdown(value.length > 0);
  }, 300);

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value.trim());
  };

  const handleSelectTest = (test) => {
    setForm({ ...form, testId: test.id.toString(), testName: test.name });
    setSearchTerm(test.name);
    setShowDropdown(false);
  };

  const handleAddTest = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.testId) {
      setError('Please select a valid test');
      toast.error('Please select a valid test', { duration: 4000 });
      return;
    }
    if (parseFloat(form.price) < 0) {
      setError('Price must be non-negative');
      toast.error('Price must be non-negative', { duration: 4000 });
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('labToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lab/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, labId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add test');
      }
      setForm({ testId: '', testName: '', availability: false, price: '' });
      setSearchTerm('');
      setShowDropdown(false);
      fetchTests();
      toast.success('Test added successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_test', { testId: form.testId });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('labToken');
        router.replace('/lab/login');
      }
    }
  };

  const handleEditTest = async (test) => {
    if (parseFloat(editForm.price) < 0) {
      setError('Price must be non-negative');
      toast.error('Price must be non-negative', { duration: 4000 });
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('labToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lab/tests`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ labId, testId: test.testId, ...editForm }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update test');
      }
      setEditingKey(null);
      setEditForm({ availability: false, price: '' });
      fetchTests();
      toast.success('Test updated successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'edit_test', { testId: test.testId });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('labToken');
        router.replace('/lab/login');
      }
    }
  };

  const handleDeleteTest = async (test) => {
    try {
      setError(null);
      const token = localStorage.getItem('labToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lab/tests?testId=${test.testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete test');
      }
      fetchTests();
      toast.success('Test deleted successfully', { duration: 4000 });
      setShowDialog({ open: false, type: '', data: null });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'delete_test', { testId: test.testId });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('labToken');
        router.replace('/lab/login');
      }
    }
  };

  const startEditing = (test) => {
    setEditingKey(`${test.labId}-${test.testId}`);
    setEditForm({ availability: test.availability, price: test.price.toString() });
  };

  const handleLogout = () => {
    localStorage.removeItem('labToken');
    router.push('/lab/login');
  };

  const filteredTests = availableTests.filter(test =>
    test.name.toLowerCase().startsWith(searchTerm.toLowerCase())
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

  if (!labId) {
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
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse"> Test Inventory</span>
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
              Add New Test
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowDialog({ open: true, type: 'addTest', data: null });
              }}
              className="space-y-6"
              role="form"
              aria-labelledby="add-test-form"
            >
              <div className="relative">
                <Label htmlFor="testName" className="text-primary font-semibold text-sm uppercase tracking-wider">Test</Label>
                <Input
                  id="testName"
                  name="testName"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                  placeholder="Type to search tests..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls="test-dropdown"
                />
                {showDropdown && filteredTests.length > 0 && (
                  <div
                    ref={dropdownRef}
                    id="test-dropdown"
                    className="absolute z-20 w-full max-h-60 overflow-y-auto bg-white/95 backdrop-blur-md border border-gray-100/30 rounded-xl shadow-lg mt-2 animate-in fade-in-20 duration-200"
                    role="listbox"
                  >
                    {filteredTests.map((test) => (
                      <div
                        key={test.id}
                        className="px-4 py-3 hover:bg-primary/10 cursor-pointer text-gray-900 text-base font-medium transition-all duration-200"
                        onClick={() => handleSelectTest(test)}
                        role="option"
                        aria-selected={form.testId === test.id.toString()}
                      >
                        {test.name}
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && filteredTests.length === 0 && searchTerm && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-20 w-full bg-white/95 backdrop-blur-md border border-gray-100/30 rounded-xl shadow-lg mt-2 p-4 text-gray-600 text-base font-medium animate-in fade-in-20 duration-200"
                  >
                    No tests found.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="availability"
                    name="availability"
                    checked={form.availability}
                    onCheckedChange={(checked) => setForm({ ...form, availability: checked })}
                    className="h-5 w-5 border-gray-200/50 text-primary focus:ring-0 focus:ring-offset-0"
                    aria-label="Test availability"
                  />
                  <Label htmlFor="availability" className="text-primary font-semibold text-sm uppercase tracking-wider">Available</Label>
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
                aria-label="Add test"
              >
                Add Test
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="my-6 shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(59,130,246,0.3)]">
          <div className="absolute top-0 left-0 w-16 h-16 bg-primary/25 rounded-br-full opacity-70" />
          <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
              <Package className="h-8 w-8 mr-3 text-primary/90 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
              Test Inventory
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
                      <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Test</TableHead>
                      <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Availability</TableHead>
                      <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Price (₦)</TableHead>
                      <TableHead className="text-primary text-sm font-bold uppercase tracking-wider py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-gray-500 text-center text-lg font-medium py-8">
                          No tests in inventory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tests.map((test, index) => (
                        <TableRow
                          key={`${test.labId}-${test.testId}`}
                          className="border-b border-gray-100/10 transition-all duration-300 hover:bg-primary/10 animate-in fade-in-20"
                          style={{ animationDelay: `${0.1 * index}s` }}
                        >
                          <TableCell className="text-base font-medium text-gray-900 py-4 truncate max-w-[250px]" title={test.name}>
                            {test.name}
                          </TableCell>
                          <TableCell className="py-4">
                            {editingKey === `${test.labId}-${test.testId}` ? (
                              <Checkbox
                                name="availability"
                                checked={editForm.availability}
                                onCheckedChange={(checked) => setEditForm({ ...editForm, availability: checked })}
                                className="h-5 w-5 border-gray-200/50 text-primary focus:ring-0 focus:ring-offset-0"
                                aria-label={`Edit availability for ${test.name}`}
                              />
                            ) : (
                              <span className="text-base font-medium text-gray-900">
                                {test.availability ? 'Available' : 'Unavailable'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {editingKey === `${test.labId}-${test.testId}` ? (
                              <Input
                                name="price"
                                type="number"
                                step="0.01"
                                value={editForm.price}
                                onChange={handleEditFormChange}
                                className="h-10 w-32 rounded-xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] text-base"
                                min="0"
                                aria-label={`Edit price for ${test.name}`}
                              />
                            ) : (
                              <span className="text-base font-medium text-gray-900">
                                {test.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {editingKey === `${test.labId}-${test.testId}` ? (
                              <div className="flex space-x-3">
                                <Button
                                  onClick={() => setShowDialog({ open: true, type: 'editTest', data: test })}
                                  className="h-10 px-4 text-sm font-semibold rounded-full bg-green-600 hover:bg-green-700 text-white hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all duration-300"
                                  aria-label={`Save changes for ${test.name}`}
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
                                  onClick={() => startEditing(test)}
                                  className="h-10 px-4 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                                  aria-label={`Edit ${test.name}`}
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => setShowDialog({ open: true, type: 'deleteTest', data: test })}
                                  className="h-10 px-4 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
                                  aria-label={`Delete ${test.name}`}
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
              onClick={() => router.push('/lab/dashboard')}
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
                {showDialog.type === 'addTest' && 'Confirm Add Test'}
                {showDialog.type === 'editTest' && 'Confirm Edit Test'}
                {showDialog.type === 'deleteTest' && 'Confirm Delete Test'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-base text-gray-600 font-medium py-4">
              {showDialog.type === 'addTest' &&
                `Add ${form.testName} with availability ${form.availability ? 'Available' : 'Unavailable'} and price ₦${form.price}?`}
              {showDialog.type === 'editTest' &&
                `Update ${showDialog.data?.name} with availability ${editForm.availability ? 'Available' : 'Unavailable'} and price ₦${editForm.price}?`}
              {showDialog.type === 'deleteTest' &&
                'Are you sure you want to delete this test? This action cannot be undone.'}
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
                  if (showDialog.type === 'addTest') {
                    handleAddTest();
                  } else if (showDialog.type === 'editTest') {
                    handleEditTest(showDialog.data);
                  } else if (showDialog.type === 'deleteTest') {
                    handleDeleteTest(showDialog.data);
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