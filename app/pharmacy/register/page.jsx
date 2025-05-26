'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UserPlus, LogIn } from 'lucide-react';

const formSchema = z.object({
  pharmacy: z.object({
    name: z.string().min(1, 'Pharmacy name is required'),
    address: z.string().min(1, 'Address is required'),
    lga: z.string().min(1, 'LGA is required'),
    state: z.string().min(1, 'State is required'),
    phone: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
    licenseNumber: z.string().min(1, 'License number is required'),
  }),
  user: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export default function PharmacyRegister() {
  const [error, setError] = useState(null);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pharmacy: { name: '', address: '', lga: '', state: '', phone: '', licenseNumber: '' },
      user: { name: '', email: '', password: '' },
    },
  });

  const onSubmit = async (values) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      localStorage.setItem('pharmacyToken', data.token);
      router.push('/pharmacy/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-lg">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8 text-center">
          Pharmacy Registration
        </h1>
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <UserPlus className="h-6 w-6 mr-2" />
              Register Pharmacy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
                <p className="text-destructive font-medium">{error}</p>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Pharmacy Details</h3>
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
                        <FormLabel className="text-primary font-medium">Local Government Area (LGA)</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="pharmacy.licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">License Number</FormLabel>
                        <FormControl>
                          <Input className="border-border" {...field} />
                        </FormControl>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">User Details</h3>
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
                  <FormField
                    control={form.control}
                    name="user.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Password</FormLabel>
                        <FormControl>
                          <Input type="password" className="border-border" {...field} />
                        </FormControl>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Register
                </Button>
              </form>
            </Form>
            <Button
              variant="link"
              className="mt-4 text-primary hover:text-secondary"
              onClick={() => router.push('/pharmacy/login')}
            >
              <LogIn className="h-5 w-5 mr-2" />
              Already registered? Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}