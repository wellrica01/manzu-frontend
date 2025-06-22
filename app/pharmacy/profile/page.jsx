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
      <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
  <div className="container mx-auto max-w-4xl space-y-12">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
        Pharmacy Profile
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse"> Settings</span>
      </h1>
      <Button
        onClick={() => router.push('/pharmacy/dashboard')}
        className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
        aria-label="Back to dashboard"
      >
        Back to Dashboard
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
          <UserCog className="h-8 w-8 mr-3 text-primary/90 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
          Profile Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        {isEditing && userRole === 'manager' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditProfile)} className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-primary mb-6 uppercase tracking-wider">User Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="user.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">Name</FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                            {...field}
                            aria-required="true"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="user.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">Email</FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                            {...field}
                            aria-required="true"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary mb-6 uppercase tracking-wider">Pharmacy Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="pharmacy.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">Pharmacy Name</FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                            {...field}
                            aria-required="true"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pharmacy.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">Address</FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                            {...field}
                            aria-required="true"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pharmacy.lga"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">LGA</FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                            {...field}
                            aria-required="true"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pharmacy.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">State</FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                            {...field}
                            aria-required="true"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pharmacy.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">Phone</FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                            {...field}
                            aria-required="true"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="h-12 px-6 text-sm font-semibold rounded-full bg-green-600 hover:bg-green-700 text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-300"
                  aria-label="Save profile changes"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                  onClick={() => setIsEditing(false)}
                  aria-label="Cancel editing"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            <div className="mb-8 animate-in fade-in-20 duration-300">
              <h3 className="text-xl font-bold text-primary mb-4 uppercase tracking-wider">User Details</h3>
              <div className="grid grid-cols-1 gap-3">
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">Name:</strong> {user.name}
                </p>
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">Email:</strong> {user.email}
                </p>
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </div>
            </div>
            <div className="mb-8 animate-in fade-in-20 duration-300">
              <h3 className="text-xl font-bold text-primary mb-4 uppercase tracking-wider">Pharmacy Details</h3>
              <div className="grid grid-cols-1 gap-3">
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">Name:</strong> {pharmacy.name}
                </p>
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">Address:</strong> {pharmacy.address}
                </p>
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">LGA:</strong> {pharmacy.lga}
                </p>
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">State:</strong> {pharmacy.state}
                </p>
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">Phone:</strong> {pharmacy.phone}
                </p>
                <p className="text-gray-700 text-base font-medium">
                  <strong className="text-primary">License Number:</strong> {pharmacy.licenseNumber}
                </p>
              </div>
            </div>
            {userRole === 'manager' && (
              <Button
                className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
                onClick={() => setIsEditing(true)}
                aria-label="Edit profile"
              >
                Edit Profile
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
    <div className="mt-8">
      <Button
        onClick={handleLogout}
        className="h-12 px-6 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5 mr-2" aria-hidden="true" />
        Logout
      </Button>
    </div>
  </div>
</div>
  );
}