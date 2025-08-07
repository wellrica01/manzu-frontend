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
import Image from 'next/image';

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
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
  <div className="relative min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500 overflow-hidden">
    {/* Background pattern */}
    <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none animate-pulse" aria-hidden="true" />
    {/* Floating decorative elements */}
    <div className="absolute top-20 left-10 w-4 h-4 bg-[#1ABA7F]/20 rounded-full animate-bounce" aria-hidden="true" />
    <div className="absolute top-40 right-20 w-6 h-6 bg-[#225F91]/20 rounded-full animate-pulse" aria-hidden="true" />
    <div className="absolute bottom-40 left-20 w-3 h-3 bg-[#1ABA7F]/30 rounded-full animate-bounce" aria-hidden="true" />
    <div className="container mx-auto max-w-md relative z-10">
      {/* Logo */}
      <div className="flex justify-center mb-4 animate-in zoom-in-50 duration-700">
        <Image src="/logo_2.svg" alt="Manzu Logo" width={64} height={64} priority />
      </div>
      {/* Trust badge */}
      <div className="flex justify-center mb-2 animate-in zoom-in-50 duration-700 delay-100">
        <span className="inline-block px-4 py-1 rounded-full bg-[#1ABA7F]/20 text-[#1ABA7F] text-xs font-semibold tracking-wide shadow-sm">Trusted by 100+ Pharmacies</span>
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#225F91] tracking-tight text-center mb-10 animate-in slide-in-from-top-10 duration-700">
        Pharmacy <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1ABA7F] to-[#225F91] animate-pulse">Login</span>
      </h1>
      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,95,145,0.2)] relative"
      >
        {/* Decorative Corner Accent */}
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
        <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-[#1ABA7F]/5 to-transparent">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-[#225F91] tracking-tight flex items-center">
            <Lock className="h-7 w-7 mr-3 text-[#1ABA7F]/80 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            Sign In to Manzu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="bg-red-50/90 border-l-4 border-red-500 p-4 mb-6 rounded-xl animate-in fade-in-20 duration-300" role="alert">
              <p className="text-red-600 text-base font-medium">{error}</p>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" aria-label="Pharmacy login form">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-[#225F91] uppercase tracking-wider" htmlFor="pharmacy-login-email">
                      Pharmacy Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1ABA7F]/70 transition-transform duration-300 group-focus-within:scale-110"
                          aria-hidden="true"
                        />
                        <Input
                          id="pharmacy-login-email"
                          className="h-14 pl-12 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
                          placeholder="Enter your pharmacy email"
                          aria-label="Pharmacy Email"
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
                    <FormLabel className="text-sm font-semibold text-[#225F91] uppercase tracking-wider" htmlFor="pharmacy-login-password">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1ABA7F]/70 transition-transform duration-300 group-focus-within:scale-110"
                          aria-hidden="true"
                        />
                        <Input
                          id="pharmacy-login-password"
                          type="password"
                          className="h-14 pl-12 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300"
                          placeholder="Enter your password"
                          aria-label="Password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center">
                <Button
                  type="submit"
                  className="h-14 px-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:from-[#1ABA7F]/90 hover:to-[#225F91]/90 hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] animate-pulse transition-all duration-300 w-full"
                  aria-label="Sign In"
                >
                  Sign In
                </Button>
              </div>
            </form>
          </Form>
          <div className="flex flex-col gap-2 mt-6">
            <Button
              variant="link"
              className="w-full text-base font-medium text-[#225F91] hover:text-[#1ABA7F] flex items-center justify-center gap-2 transition-colors duration-300"
              onClick={() => router.push('/pharmacy/register')}
              aria-label="Go to registration"
            >
              <UserPlus className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
              Need to register? Sign up
            </Button>
            <Button
              variant="link"
              className="w-full text-sm font-medium text-[#225F91] hover:text-[#1ABA7F] flex items-center justify-center gap-2 transition-colors duration-300"
              onClick={() => alert('Password reset coming soon!')}
              aria-label="Forgot password"
            >
              Forgot password?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
}