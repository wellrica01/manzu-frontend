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
import { Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export default function AdminLogin() {
  const [error, setError] = useState(null);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('adminToken', data.token);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-md">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8 text-center">
          Admin Login
        </h1>
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <Lock className="h-6 w-6 mr-2" />
              Admin Sign In
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
                <FormField
                  control={form.control}
                  name="email"
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
                  name="password"
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
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}