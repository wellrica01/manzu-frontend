'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PharmacyUserDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/pharmacy-users/${params.id}`, {
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
        throw new Error('Failed to fetch pharmacy user');
      }
      const result = await response.json();
      setUser(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      fetchUser();
    }
  }, [params.id, authChecked]);

  if (!authChecked) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading pharmacy user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="card bg-destructive/10 border-l-4 border-destructive p-4 max-w-md mx-auto">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="card bg-muted/10 p-4 max-w-md mx-auto">
          <p className="text-muted-foreground text-center">Pharmacy user not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">Pharmacy User #{user.id}</h1>
          <Link href="/admin/pharmacy-users">
            <Button variant="outline" className="text-primary hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pharmacy Users
            </Button>
          </Link>
        </div>
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary">Pharmacy User Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <p className="text-foreground"><strong>ID:</strong> {user.id}</p>
            <p className="text-foreground"><strong>Email:</strong> {user.email}</p>
            <p className="text-foreground"><strong>Name:</strong> {user.name}</p>
            <p className="text-foreground"><strong>Role:</strong> {user.role}</p>
            <p className="text-foreground"><strong>Pharmacy:</strong> {user.pharmacy?.name || '-'} (ID: {user.pharmacy?.id || '-'})</p>
            <p className="text-foreground"><strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</p>
            <p className="text-foreground"><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}