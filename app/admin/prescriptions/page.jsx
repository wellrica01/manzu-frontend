'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, FileText } from 'lucide-react';

export default function Prescriptions() {
  const [data, setData] = useState({ prescriptions: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    patientIdentifier: '',
  });
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

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const query = new URLSearchParams({
        page,
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.patientIdentifier && { patientIdentifier: filters.patientIdentifier }),
      }).toString();
      const response = await fetch(`http://localhost:5000/api/admin/prescriptions?${query}`, {
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
        throw new Error('Failed to fetch prescriptions');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    fetchPrescriptions();
  }, [page, filters, authChecked]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === 'all' ? '' : value }));
    setPage(1);
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
        <p className="text-muted-foreground ml-2">Loading prescriptions...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Prescriptions
          </h1>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-muted hover:bg-muted/90 text-foreground"
          >
            Back to Dashboard
          </Button>
        </div>
        <Card className="card card-shadow fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Prescription List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="block text-sm font-medium text-primary mb-1">Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-primary mb-1">Patient Identifier</Label>
                <Input
                  value={filters.patientIdentifier}
                  onChange={(e) => handleFilterChange('patientIdentifier', e.target.value)}
                  placeholder="Filter by patient identifier"
                  className="border-border"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID</TableHead>
                  <TableHead className="text-primary">Patient Identifier</TableHead>
                  <TableHead className="text-primary">Status</TableHead>
                  <TableHead className="text-primary">Created At</TableHead>
                  <TableHead className="text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.prescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      No prescriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.prescriptions.map((prescription, index) => (
                    <TableRow key={prescription.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                      <TableCell>{prescription.id}</TableCell>
                      <TableCell>{prescription.patientIdentifier}</TableCell>
                      <TableCell>{prescription.status.toUpperCase()}</TableCell>
                      <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/admin/prescriptions/${prescription.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-primary hover:bg-muted"
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {data.pagination.page || 1} of {data.pagination.pages || 1}
              </span>
              <Button
                disabled={page === data.pagination.pages}
                onClick={() => setPage(page + 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}