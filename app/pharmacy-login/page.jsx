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
import { LogIn, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

// ✅ Import the API client
import { pharmacyAuthAPI, setPharmacyToken } from '@/lib/pharmacyApiClient';
import { APIError } from '@/lib/apiClient';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  pin: z.string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

export default function PharmacyLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      pin: '',
    },
  });

  // ✅ Updated submit handler using API client
  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);

      // ✅ Use the API client instead of fetch
      const data = await pharmacyAuthAPI.login(values);

      toast.success('Login successful!');
      
      // ✅ Use the helper function to store token
      setPharmacyToken(data.token);
      
      // ✅ Navigate immediately (Next.js handles the transition)
      router.push('/pharmacy/dashboard');

    } catch (err) {
      // ✅ Handle APIError and regular errors
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Login failed. Please try again.';
      
      toast.error(errorMessage);
      
      // Log error for debugging (remove in production or use proper logging)
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image src="/logo_1.png" alt="Manzu Logo" width={32} height={32} priority />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#225F91] text-center mb-8">
          Pharmacy Login
        </h1>

        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent">
            <CardTitle className="text-xl font-bold text-[#225F91] flex items-center gap-2">
              <LogIn className="h-5 w-5 text-[#1ABA7F]" />
              Sign In
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        6-Digit PIN <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="••••••"
                          className="h-14 text-2xl text-center tracking-widest rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/pharmacy-register')}
                  className="w-full text-[#225F91] hover:text-[#1ABA7F]"
                >
                  Don't have an account? Register
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}