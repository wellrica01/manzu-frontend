'use client';
import { useState, useRef } from 'react';
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
  const [pinValues, setPinValues] = useState(['', '', '', '', '', '']);
  const pinInputRefs = useRef([]);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      pin: '',
    },
  });

  // Handle PIN input changes
  const handlePinChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPinValues = [...pinValues];
    newPinValues[index] = value;
    setPinValues(newPinValues);

    // Update form value
    form.setValue('pin', newPinValues.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinValues[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newPinValues = pastedData.split('');
    while (newPinValues.length < 6) {
      newPinValues.push('');
    }
    
    setPinValues(newPinValues.slice(0, 6));
    form.setValue('pin', pastedData);
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    pinInputRefs.current[nextIndex]?.focus();
  };

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);

      const data = await pharmacyAuthAPI.login(values);

      toast.success('Login successful!');
      setPharmacyToken(data.token);
      router.push('/pharmacy/dashboard');

    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Login failed. Please try again.';
      
      toast.error(errorMessage);
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

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#225F91] text-center mb-6 sm:mb-8">
          Pharmacy Login
        </h1>

        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent">
            <CardTitle className="text-lg sm:text-xl font-bold text-[#225F91] flex items-center gap-2">
              <LogIn className="h-4 w-4 sm:h-5 sm:w-5 text-[#1ABA7F]" />
              Sign In
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-7">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className='px-1'>
                        <Input
                          type="email"
                          placeholder="Enter your email address here"
                          className="h-12 sm:h-14 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0"
                          {...field}
                        />
                        </div>
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
                        <div className="flex gap-2 sm:gap-2 justify-center px-1">
                          {pinValues.map((value, index) => (
                            <input
                              key={index}
                              ref={(el) => (pinInputRefs.current[index] = el)}
                              type="password"
                              inputMode="numeric"
                              maxLength={1}
                              value={value}
                              onChange={(e) => handlePinChange(index, e.target.value)}
                              onKeyDown={(e) => handlePinKeyDown(index, e)}
                              onPaste={handlePinPaste}
                              className="w-10 h-12 sm:w-12 sm:h-14 p-0 text-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-2 focus:ring-[#1ABA7F]/20 focus:outline-none transition-all"                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-lg bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
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
                  className="w-full text-sm sm:text-base text-[#225F91] hover:text-[#1ABA7F]"
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