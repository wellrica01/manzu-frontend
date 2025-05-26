'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, UserCog, LogOut } from 'lucide-react';

const editProfileSchema = z.object({
  user: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  }),
  pharmacy: z.object({
    name: z.string().min(1, 'Pharmacy name is required'),
    address: z.string().min(1, 'Address is required'),
    lga: z.string().min(1, 'LGA is required'),
    state: z.string().min(1, 'State is required'),
    phone: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
  }),
});

export default function PharmacyProfile() {
  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      user: { name: '', email: '' },
      pharmacy: { name: '', address: '', lga: '', state: '', phone: '' },
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    if (!token) {
      router.replace('/pharmacy/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role);
    } catch (err) {
      localStorage.removeItem('pharmacyToken');
      router.replace('/pharmacy/login');
    }
  }, [router]);

  const fetchProfile = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      if (!token) {
        router.replace('/pharmacy/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      const data = await response.json();
      setUser(data.user);
      setPharmacy(data.pharmacy);
      form.reset({
        user: { name: data.user.name, email: data.user.email },
        pharmacy: {
          name: data.pharmacy.name,
          address: data.pharmacy.address,
          lga: data.pharmacy.lga,
          state: data.pharmacy.state,
          phone: data.pharmacy.phone,
        },
      });
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('pharmacyToken');
        router.replace('/pharmacy/login');
      }
    }
  };

  useEffect(() => {
    if (userRole) {
      fetchProfile();
    }
  }, [userRole]);

  const handleEditProfile = async (values) => {
    try {
      setError(null);
      const token = localStorage.getItem('pharmacyToken');
      if (!token) {
        router.replace('/pharmacy/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      setUser(data.user);
      setPharmacy(data.pharmacy);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    router.push('/pharmacy/login');
  };

  if (!user || !pharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Pharmacy Profile
          </h1>
          <Button
            onClick={() => router.push('/pharmacy/dashboard')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Back to Dashboard
          </Button>
        </div>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <UserCog className="h-6 w-6 mr-2" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isEditing && userRole === 'manager' ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEditProfile)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4">User Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="user.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">Name</FormLabel>
                            <FormControl>
                              <Input className="border-border" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="user.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">Email</FormLabel>
                            <FormControl>
                              <Input className="border-border" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4">Pharmacy Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pharmacy.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">Pharmacy Name</FormLabel>
                            <FormControl>
                              <Input className="border-border" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pharmacy.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">Address</FormLabel>
                            <FormControl>
                              <Input className="border-border" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pharmacy.lga"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">LGA</FormLabel>
                            <FormControl>
                              <Input className="border-border" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pharmacy.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">State</FormLabel>
                            <FormControl>
                              <Input className="border-border" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pharmacy.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">Phone</FormLabel>
                            <FormControl>
                              <Input className="border-border" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      className="bg-success hover:bg-success/90 text-primary-foreground"
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border text-primary hover:bg-muted"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-2">User Details</h3>
                  <p className="text-muted-foreground"><strong>Name:</strong> {user.name}</p>
                  <p className="text-muted-foreground"><strong>Email:</strong> {user.email}</p>
                  <p className="text-muted-foreground"><strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-2">Pharmacy Details</h3>
                  <p className="text-muted-foreground"><strong>Name:</strong> {pharmacy.name}</p>
                  <p className="text-muted-foreground"><strong>Address:</strong> {pharmacy.address}</p>
                  <p className="text-muted-foreground"><strong>LGA:</strong> {pharmacy.lga}</p>
                  <p className="text-muted-foreground"><strong>State:</strong> {pharmacy.state}</p>
                  <p className="text-muted-foreground"><strong>Phone:</strong> {pharmacy.phone}</p>
                  <p className="text-muted-foreground"><strong>License Number:</strong> {pharmacy.licenseNumber}</p>
                </div>
                {userRole === 'manager' && (
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <div className="mt-6">
          <Button
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-primary-foreground"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}