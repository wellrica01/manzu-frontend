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
     <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
  <div className="container mx-auto max-w-md space-y-8">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight">
      Admin Login
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse"> Portal</span>
    </h1>
    <Card className="shadow-3xl border border-gray-100/20 rounded-3xl overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(59,130,246,0.3)] animate-in fade-in-20">
      <div className="absolute top-0 left-0 w-16 h-16 bg-primary/25 rounded-br-full opacity-70" />
      <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
          <Lock className="h-8 w-8 mr-3 text-primary/90 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
          Admin Sign In
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        {error && (
          <div
            className="bg-red-50/90 border-l-4 border-red-500 p-4 rounded-xl mb-6 animate-in fade-in-20 duration-300"
            role="alert"
          >
            <p className="text-red-600 text-base font-medium">{error}</p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-semibold text-sm uppercase tracking-wider">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="h-12 mt-2 rounded-2xl bg-white/95 border-gray-200/30 text-gray-900 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 text-base"
                      {...field}
                      aria-required="true"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-sm mt-1" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 animate-pulse"
              aria-label="Login"
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