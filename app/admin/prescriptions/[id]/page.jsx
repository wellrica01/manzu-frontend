'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Loader2, FileText, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PrescriptionDetails() {
  const [prescription, setPrescription] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [medicationInputs, setMedicationInputs] = useState([{ medicationId: '', quantity: 1, pharmacyId: '', searchTerm: '' }]);
  const [suggestions, setSuggestions] = useState({});
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

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
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

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/pharmacies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch pharmacies');
      }
      const data = await response.json();
      setPharmacies(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

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
      fetchPharmacies();
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
    inputRefs.current[index]?.focus(); // Return focus to input
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
      inputRefs.current[index]?.focus();
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
    if (!isFormValid) {
      toast.error('Please complete all required fields for medications.');
      return;
    }
    setSubmitting('medications');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/prescription/${params.id}/medications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medications: medicationInputs.map(({ medicationId, quantity, pharmacyId }) => ({
            medicationId,
            quantity,
            pharmacyId: pharmacyId || null,
          })),
        }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add medications');
      }
      await fetchPrescription();
      setMedicationInputs([{ medicationId: '', quantity: 1, pharmacyId: '', searchTerm: '' }]);
      toast.success('Medications added and order created');
    } catch (err) {
      setError(err.message);
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
      if (!token) {
        router.replace('/admin/login');
        return;
      }
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
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const isFormValid = medicationInputs.every(
    (input) => input.medicationId && input.quantity >= 1
  );

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
        <p className="text-muted-foreground ml-2">Loading prescription details...</p>
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

  if (!prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="card bg-muted p-4 fade-in">
          <p className="text-muted-foreground">Prescription not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Prescription #{prescription.id}
          </h1>
          <div className="flex space-x-2">
            {prescription.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleVerify('verified')}
                  disabled={submitting !== null}
                  className="bg-primary hover:bg-success/90 text-primary-foreground"
                >
                  {submitting === 'verified' ? 'Verifying...' : 'Verify'}
                </Button>
                <Button
                  onClick={() => handleVerify('rejected')}
                  disabled={submitting !== null}
                  className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
                >
                  {submitting === 'rejected' ? 'Rejecting...' : 'Reject'}
                </Button>
              </>
            )}
            <Link href="/admin/prescriptions">
              <Button className="bg-muted hover:bg-muted/90 text-foreground">
                Back to Prescriptions
              </Button>
            </Link>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="card card-shadow fade-in">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Prescription Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <p className="text-muted-foreground"><strong>ID:</strong> {prescription.id}</p>
              <p className="text-muted-foreground"><strong>Patient Identifier:</strong> {prescription.patientIdentifier}</p>
              <p className="text-muted-foreground"><strong>Status:</strong> {prescription.status.toUpperCase()}</p>
              <p className="text-muted-foreground"><strong>Verified:</strong> {prescription.verified ? 'Yes' : 'No'}</p>
              <p className="text-muted-foreground"><strong>Created:</strong> {new Date(prescription.createdAt).toLocaleDateString()}</p>
              {prescription.fileUrl && (
                <div>
                  <strong className="text-primary">Prescription File:</strong>
                  {prescription.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img src={`http://localhost:5000${prescription.fileUrl}`} alt="Prescription" className="h-48 mt-2 rounded shadow-sm" />
                  ) : (
                    <a href={prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                      View Prescription File
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="card card-shadow fade-in">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                <Plus className="h-6 w-6 mr-2" />
                Add Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {medicationInputs.map((input, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                  <div className="relative sm:col-span-5">
                    <Label className="text-primary">Medication *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <Input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        placeholder="Search for medications..."
                        value={input.searchTerm}
                        onChange={(e) => handleMedicationChange(index, 'searchTerm', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="pl-10 border-border"
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
                          className="absolute z-20 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          role="listbox"
                        >
                          {isLoadingSuggestions[index] ? (
                            <div className="px-4 py-3 flex items-center text-primary">
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Loading...
                            </div>
                          ) : suggestions[index]?.length > 0 ? (
                            suggestions[index].map((med, i) => (
                              <div
                                key={med.id}
                                className={`px-4 py-3 text-foreground cursor-pointer hover:bg-muted transition-colors ${i === focusedSuggestionIndices[index] ? 'bg-muted' : ''}`}
                                onClick={() => handleSelectMedication(index, med)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSelectMedication(index, med)}
                                role="option"
                                tabIndex={0}
                                aria-selected={i === focusedSuggestionIndices[index]}
                              >
                                {med.displayName}
                              </div>
                            ))
                          ) : (
                            input.searchTerm && (
                              <div className="px-4 py-3 text-muted-foreground italic">
                                No medications found for "{input.searchTerm}"
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-primary">Quantity *</Label>
                    <Input
                      type="number"
                      value={input.quantity}
                      onChange={(e) => handleMedicationChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="border-border"
                      aria-label="Quantity"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <Button
                      onClick={() => removeMedicationInput(index)}
                      disabled={medicationInputs.length === 1}
                      className="bg-destructive hover:bg-destructive/90 text-primary-foreground w-full"
                      aria-label="Remove medication"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!isFormValid && (
                <div className="card bg-destructive/10 border-l-4 border-destructive p-2 mb-4">
                  <p className="text-destructive text-sm">Please select a medication and valid quantity for all entries.</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                <Button
                  onClick={addMedicationInput}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Medication
                </Button>
                <Button
                  onClick={handleAddMedications}
                  disabled={submitting === 'medications' || !isFormValid}
                  className="bg-primary hover:bg-success/90 text-primary-foreground"
                >
                  {submitting === 'medications' ? 'Adding...' : 'Add Medications and Create Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="card card-shadow fade-in">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Related Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {prescription.orders && prescription.orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary">Order ID</TableHead>
                      <TableHead className="text-primary">Pharmacy</TableHead>
                      <TableHead className="text-primary">Status</TableHead>
                      <TableHead className="text-primary">Total Amount</TableHead>
                      <TableHead className="text-primary">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescription.orders.map((order, index) => (
                      <TableRow key={order.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.pharmacy?.name || 'N/A'}</TableCell>
                        <TableCell>{order.status.toUpperCase()}</TableCell>
                        <TableCell>{order.totalPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</TableCell>
                        <TableCell>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-primary hover:bg-muted"
                            >
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No orders associated with this prescription.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}