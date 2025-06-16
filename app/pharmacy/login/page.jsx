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
import { Lock, UserPlus, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function PharmacyLogin() {
  const [error, setError] = useState(null);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('pharmacyToken', data.token);
      router.push('/pharmacy/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

return (
  <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
    <div className="container mx-auto max-w-md">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight text-center mb-10 animate-in slide-in-from-top-10 duration-700">
        Pharmacy <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse">Login</span>
      </h1>
      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
      >
        {/* Decorative Corner Accent */}
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
            <Lock className="h-7 w-7 mr-3 text-primary/80 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            Sign In to Manzu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="bg-red-50/90 border-l-4 border-red-500 p-4 mb-6 rounded-xl animate-in fade-in-20 duration-300">
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
                    <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70 transition-transform duration-300 group-focus-within:scale-110"
                          aria-hidden="true"
                        />
                        <Input
                          className="h-14 pl-12 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70 transition-transform duration-300 group-focus-within:scale-110"
                          aria-hidden="true"
                        />
                        <Input
                          type="password"
                          className="h-14 pl-12 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-14 px-6 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300"
              >
                Sign In
              </Button>
            </form>
          </Form>
          <Button
            variant="link"
            className="mt-6 w-full text-base font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-2 transition-colors duration-300"
            onClick={() => router.push('/pharmacy/register')}
          >
            <UserPlus className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            Need to register? Sign up
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);
}