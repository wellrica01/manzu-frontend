'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PrescriptionDetails() {
  const [prescription, setPrescription] = useState(null);
  const [pharmacies, setPharmacies] = useState([]); // New state for pharmacies
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [medicationInputs, setMedicationInputs] = useState([{ medicationId: '', quantity: 1, pharmacyId: '', searchTerm: '' }]);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdowns, setShowDropdowns] = useState({});
  const [focusedSuggestionIndices, setFocusedSuggestionIndices] = useState({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState({});
  const router = useRouter();
  const params = useParams();
  const [authChecked, setAuthChecked] = useState(false);
  const dropdownRefs = useRef({});
  const inputRefs = useRef({});

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // Fetch prescription details
  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/prescriptions/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch prescription');
      }
      const result = await response.json();
      setPrescription(result.prescription);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pharmacies
  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/pharmacies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pharmacies');
      const data = await response.json();
      setPharmacies(data);
    } catch (err) {
      toast.error('Failed to fetch pharmacies');
    }
  };

  // Fetch medication suggestions
  const fetchSuggestions = async (query, index) => {
    if (!query.trim()) {
      setSuggestions((prev) => ({ ...prev, [index]: [] }));
      setShowDropdowns((prev) => ({ ...prev, [index]: false }));
      setIsLoadingSuggestions((prev) => ({ ...prev, [index]: false }));
      return;
    }
    try {
      setIsLoadingSuggestions((prev) => ({ ...prev, [index]: true }));
      const res = await fetch(`http://localhost:5000/api/medication-suggestions?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data = await res.json();
      setSuggestions((prev) => ({ ...prev, [index]: data }));
      setShowDropdowns((prev) => ({ ...prev, [index]: true }));
      setFocusedSuggestionIndices((prev) => ({ ...prev, [index]: -1 }));
    } catch (error) {
      setSuggestions((prev) => ({ ...prev, [index]: [] }));
      setShowDropdowns((prev) => ({ ...prev, [index]: false }));
      toast.error('Failed to fetch suggestions');
    } finally {
      setIsLoadingSuggestions((prev) => ({ ...prev, [index]: false }));
    }
  };

  useEffect(() => {
    if (params.id && authChecked) {
      fetchPrescription();
      fetchPharmacies(); // Fetch pharmacies on component mount
    }
  }, [params.id, authChecked]);

  useEffect(() => {
    medicationInputs.forEach((input, index) => {
      const debounce = setTimeout(() => {
        fetchSuggestions(input.searchTerm, index);
      }, 300);
      return () => clearTimeout(debounce);
    });
  }, [medicationInputs]);

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medicationInputs];
    updated[index][field] = value;
    setMedicationInputs(updated);
  };

  const handleSelectMedication = (index, med) => {
    const updated = [...medicationInputs];
    updated[index].medicationId = med.id.toString();
    updated[index].searchTerm = med.displayName;
    setMedicationInputs(updated);
    setShowDropdowns((prev) => ({ ...prev, [index]: false }));
    setFocusedSuggestionIndices((prev) => ({ ...prev, [index]: -1 }));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' && focusedSuggestionIndices[index] === -1 && medicationInputs[index].searchTerm) {
      e.preventDefault();
    } else if (!showDropdowns[index] || !suggestions[index]?.length) {
      return;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndices((prev) => {
        const next = Math.min(prev[index] + 1, suggestions[index].length - 1);
        return { ...prev, [index]: next };
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndices((prev) => {
        const next = Math.max(prev[index] - 1, -1);
        if (next === -1) inputRefs.current[index]?.focus();
        return { ...prev, [index]: next };
      });
    } else if (e.key === 'Enter' && focusedSuggestionIndices[index] >= 0) {
      e.preventDefault();
      handleSelectMedication(index, suggestions[index][focusedSuggestionIndices[index]]);
    } else if (e.key === 'Escape') {
      setShowDropdowns((prev) => ({ ...prev, [index]: false }));
      setFocusedSuggestionIndices((prev) => ({ ...prev, [index]: -1 }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs.current).forEach((index) => {
        if (dropdownRefs.current[index] && !dropdownRefs.current[index].contains(event.target)) {
          setShowDropdowns((prev) => ({ ...prev, [index]: false }));
          setFocusedSuggestionIndices((prev) => ({ ...prev, [index]: -1 }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addMedicationInput = () => {
    setMedicationInputs([...medicationInputs, { medicationId: '', quantity: 1, pharmacyId: '', searchTerm: '' }]);
  };

  const removeMedicationInput = (index) => {
    setMedicationInputs(medicationInputs.filter((_, i) => i !== index));
    setShowDropdowns((prev) => {
      const newDropdowns = { ...prev };
      delete newDropdowns[index];
      return newDropdowns;
    });
    setFocusedSuggestionIndices((prev) => {
      const newIndices = { ...prev };
      delete newIndices[index];
      return newIndices;
    });
  };

const handleAddMedications = async () => {
  setSubmitting('medications');
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/prescription/${params.id}/medications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ medications: medicationInputs.map(({ medicationId, quantity }) => ({ medicationId, quantity })) }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add medications');
    }
    await fetchPrescription();
    setMedicationInputs([{ medicationId: '', quantity: 1, searchTerm: '' }]);
    toast.success('Medications added and order created');
  } catch (err) {
    toast.error(err.message);
  } finally {
    setSubmitting(null);
  }
};

  const handleVerify = async (status) => {
    setSubmitting(status);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/prescription/${params.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error(`Failed to update prescription: ${response.statusText}`);
      }
      await fetchPrescription();
      toast.success(`Prescription ${status}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (!authChecked) return null;
  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  if (!prescription) return <div className="text-center p-6">Prescription not found</div>;

  const isFormValid = medicationInputs.every(input => input.medicationId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prescription #{prescription.id}</h1>
        <div className="space-x-2">
          {prescription.status === 'pending' && (
            <>
              <Button
                onClick={() => handleVerify('verified')}
                disabled={submitting !== null}
              >
                {submitting === 'verified' ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVerify('rejected')}
                disabled={submitting !== null}
              >
                {submitting === 'rejected' ? 'Rejecting...' : 'Reject'}
              </Button>
            </>
          )}
          <Link href="/admin/prescriptions">
            <Button variant="outline">Back to Prescriptions</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Prescription Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>ID:</strong> {prescription.id}</p>
          <p><strong>Patient Identifier:</strong> {prescription.patientIdentifier}</p>
          <p><strong>Status:</strong> {prescription.status}</p>
          <p><strong>Verified:</strong> {prescription.verified ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> {new Date(prescription.createdAt).toLocaleDateString()}</p>
          {prescription.fileUrl && (
            <div>
              <strong>Prescription File:</strong>
              {prescription.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={prescription.fileUrl} alt="Prescription" className="h-48 mt-2" />
              ) : (
                <a href={prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  View Prescription File
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
<Card>
  <CardHeader>
    <CardTitle>Add Medications</CardTitle>
  </CardHeader>
  <CardContent>
    {medicationInputs.map((input, index) => (
      <div key={index} className="grid grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Label>Medication</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-teal-500" aria-hidden="true" />
            </div>
            <Input
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              placeholder="Search for medications..."
              value={input.searchTerm}
              onChange={(e) => handleMedicationChange(index, 'searchTerm', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="pl-10 py-3 text-gray-900 bg-white border border-teal-200 rounded-full shadow-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 w-full"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={showDropdowns[index] || false}
              aria-controls={`suggestions-list-${index}`}
              role="combobox"
              aria-label="Search for medications"
            />
            {showDropdowns[index] && (
              <div
                ref={(el) => (dropdownRefs.current[index] = el)}
                id={`suggestions-list-${index}`}
                className="absolute z-20 w-full mt-2 bg-white border border-teal-200 rounded-lg shadow-lg max-h-60 overflow-y-auto transition-all duration-300 ease-in-out"
                role="listbox"
              >
                {isLoadingSuggestions[index] ? (
                  <div className="px-4 py-3 flex items-center text-teal-600">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : suggestions[index]?.length > 0 ? (
                  suggestions[index].map((med, i) => (
                    <div
                      key={med.id}
                      className={`px-4 py-3 text-gray-800 cursor-pointer hover:bg-teal-50 transition-colors duration-150 ${
                        i === focusedSuggestionIndices[index] ? 'bg-teal-100' : ''
                      }`}
                      onClick={() => handleSelectMedication(index, med)}
                      role="option"
                      aria-selected={i === focusedSuggestionIndices[index]}
                    >
                      {med.displayName}
                    </div>
                  ))
                ) : (
                  input.searchTerm && (
                    <div className="px-4 py-3 text-teal-500 italic">
                      No medications found for "{input.searchTerm}"
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            value={input.quantity}
            onChange={(e) => handleMedicationChange(index, 'quantity', parseInt(e.target.value) || 1)}
            min="1"
            className="py-3 text-gray-900 bg-white border border-teal-200 rounded-full shadow-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300"
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="destructive"
            onClick={() => removeMedicationInput(index)}
            disabled={medicationInputs.length === 1}
          >
            Remove
          </Button>
        </div>
      </div>
    ))}
    {!isFormValid && (
      <p className="text-red-500 mb-4">Please select a medication for all entries.</p>
    )}
    <div className="space-x-2">
      <Button onClick={addMedicationInput} className="rounded-full">
        Add Another Medication
      </Button>
      <Button
        onClick={handleAddMedications}
        disabled={submitting === 'medications' || !isFormValid}
        className="rounded-full"
      >
        {submitting === 'medications' ? 'Adding...' : 'Add Medications and Create Order'}
      </Button>
    </div>
  </CardContent>
</Card>
      <Card>
        <CardHeader>
          <CardTitle>Related Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {prescription.orders && prescription.orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescription.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.pharmacy?.name || 'N/A'}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>₦{order.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No orders associated with this prescription.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}