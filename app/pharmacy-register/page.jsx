'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { usePharmacyGPSCapture } from '@/hooks/usePharmacyGPSCapture';
import { PharmacyGPSCaptureUI } from './PharmacyGPSCaptureUI';
import { Input } from '@/components/ui/input';
import { UserPlus, LogIn, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Select from 'react-select';
import Image from 'next/image';
import { toast } from 'sonner';

// âœ… Import the API client
import { pharmacyAuthAPI, setPharmacyToken } from '@/app/pharmacy/pharmacyApiClient';
import { APIError } from '@/lib/apiClient';

// Load state-LGA mapping
import STATE_LGA_MAP from '@/public/data/stateLga.json';

const formSchema = z.object({
  pharmacy: z.object({
    name: z.string().min(3, 'Pharmacy name must be at least 3 characters'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    state: z.string().min(1, 'State is required'),
    lga: z.string().min(1, 'LGA is required'),
    latitude: z.number()
      .min(4, 'Latitude must be within Nigeria (4Â°N to 14Â°N)')
      .max(14, 'Latitude must be within Nigeria (4Â°N to 14Â°N)'),
    
    longitude: z.number()
      .min(3, 'Longitude must be within Nigeria (3Â°E to 15Â°E)')
      .max(15, 'Longitude must be within Nigeria (3Â°E to 15Â°E)'),
    locationAccuracy: z.number().optional(),
    phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number (e.g., 08012345678)'),
    licenseNumber: z.string().min(5, 'License number must be at least 5 characters'),
  }),
  user: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    pin: z.string()
      .length(6, 'PIN must be exactly 6 digits')
      .regex(/^\d{6}$/, 'PIN must contain only numbers'),
  }),
});

export default function PharmacyRegister() {
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [pinValues, setPinValues] = useState(['', '', '', '', '', '']);
  const pinInputRefs = useRef([]);
  const gpsCapture = usePharmacyGPSCapture();
  
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pharmacy: { 
        name: '', 
        address: '', 
        state: '', 
        lga: '',
        latitude: 0, 
        longitude: 0,
        locationAccuracy: 0,
        phone: '', 
        licenseNumber: '' 
      },
      user: { name: '', email: '', pin: '' },
    },
  });

  // Load states on mount
  useEffect(() => {
    const stateOptions = Object.keys(STATE_LGA_MAP).map(state => ({
      value: state,
      label: state,
    }));
    setStates(stateOptions);
  }, []);

  // Update LGAs when state changes
  const updateLgas = (state) => {
    const lgaList = STATE_LGA_MAP[state] || [];
    setLgas(lgaList.map(lga => ({
      value: lga,
      label: lga,
    })));
    form.setValue('pharmacy.lga', '');
  };


// Capture GPS location
const handleCaptureLocation = async () => {
  try {
    const location = await gpsCapture.captureAccurateLocation();
    
    // Update form with captured location
    form.setValue('pharmacy.latitude', location.latitude);
    form.setValue('pharmacy.longitude', location.longitude);
    form.setValue('pharmacy.locationAccuracy', location.accuracy);
    
    // Success toast based on quality
    if (location.quality === 'excellent') {
      toast.success('🎯 Perfect Location Captured!', {
        description: `Accuracy: ±${location.accuracy}m from ${location.sampleCount} samples.`,
      });
    } else if (location.quality === 'good') {
      toast.success('✅ Excellent Location Captured!', {
        description: `Accuracy: ±${location.accuracy}m. Very suitable for registration.`,
      });
    } else if (location.quality === 'acceptable') {
      toast.success('✓ Good Location Captured', {
        description: `Accuracy: ±${location.accuracy}m. Acceptable for registration.`,
      });
    } else if (location.quality === 'usable') {
      toast.warning('⚠️ Low Accuracy', {
        description: `Accuracy: ±${location.accuracy}m. Consider recapturing outdoors.`,
      });
    }

  } catch (err) {
    console.error('GPS capture error:', err);
    
    // Error toast
    if (err.code === 1) {
      toast.error('Location Permission Denied', {
        description: 'Please enable location access in your browser settings.',
      });
    } else if (err.code === 2) {
      toast.error('Location Unavailable', {
        description: 'Please check your GPS settings and try outdoors.',
      });
    } else if (err.code === 3) {
      toast.error('Location Timeout', {
        description: 'Please try outdoors with clear sky view.',
      });
    } else {
      toast.error('Location Capture Failed', {
        description: err.message || 'Unable to capture location.',
      });
    }
  }
};


// Handle PIN input changes
const handlePinChange = (index, value) => {
  if (value && !/^\d$/.test(value)) return;

  const newPinValues = [...pinValues];
  newPinValues[index] = value;
  setPinValues(newPinValues);

  form.setValue('user.pin', newPinValues.join(''));

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
  form.setValue('user.pin', pastedData);
  
  const nextIndex = Math.min(pastedData.length, 5);
  pinInputRefs.current[nextIndex]?.focus();
};


  // Updated submit handler using API client
  const onSubmit = async (values) => {
    // Validate GPS was captured
    if (!gpsCapture.location) {
      toast.error('Please capture your pharmacy location using GPS');
      return;
    }

    if (gpsCapture.location.quality === 'poor') {
      toast.error('GPS accuracy is too low. Please recapture location outdoors with clear sky view.');
      return;
    }

    if (gpsCapture.location.quality === 'usable' && gpsCapture.location.accuracy > 300) {
      toast.warning('Low accuracy detected', {
        description: `Accuracy is ±${gpsCapture.location.accuracy}m. Consider recapturing for better precision.`,
        duration: 5000,
        action: {
          label: 'Continue Anyway',
          onClick: () => {
            // Allow submission
            form.handleSubmit(onSubmit)();
          }
        }
      });
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      const data = await pharmacyAuthAPI.register(values);
      toast.success('Registration successful! Redirecting to dashboard...');
      setPharmacyToken(data.token);
      router.push('/pharmacy/dashboard');

    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Registration failed. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };



  // Custom select styles
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '3.5rem',
      border: `2px solid ${state.isFocused ? 'rgb(26, 186, 127)' : 'rgb(229, 231, 235)'}`,
      boxShadow: state.isFocused ? '0 0 0 3px rgba(26, 186, 127, 0.1)' : 'none',
      background: 'white',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: 'rgb(26, 186, 127)',
      },
    }),
    menu: (provided) => ({
      ...provided,
      background: 'white',
      border: '2px solid rgb(229, 231, 235)',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isSelected 
        ? 'rgb(26, 186, 127)' 
        : state.isFocused 
        ? 'rgba(26, 186, 127, 0.1)' 
        : 'white',
      color: state.isSelected ? 'white' : 'rgb(17, 24, 39)',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      fontSize: '0.95rem',
      '&:active': {
        background: 'rgb(26, 186, 127)',
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-4 px-1 sm:py-8 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <Image 
            src="/logo_1.png" 
            alt="Manzu Logo" 
            width={32} 
            height={32} 
            className="sm:w-16 sm:h-16"
            priority 
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#225F91] text-center mb-6 sm:mb-8">
          Join <span className="text-[#1ABA7F]">Manzu</span>
        </h1>

        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent">
            <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91] flex items-center gap-2">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-[#1ABA7F]" />
              Register Your Pharmacy
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg">
                <p className="text-red-700 text-sm sm:text-base font-medium">{error}</p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7 sm:space-y-8">
                {/* Pharmacy Details */}
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-[#225F91]">Pharmacy Details</h3>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="pharmacy.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Pharmacy Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 sm:h-14 text-base rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="pharmacy.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Street Address <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 sm:h-14 text-base rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* State & LGA Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* State */}
                    <FormField
                      control={form.control}
                      name="pharmacy.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            State <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={states}
                              onChange={(selected) => {
                                field.onChange(selected?.value || '');
                                updateLgas(selected?.value || '');
                              }}
                              value={states.find((option) => option.value === field.value) || null}
                              placeholder="Select state"
                              styles={selectStyles}
                              isClearable
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* LGA */}
                    <FormField
                      control={form.control}
                      name="pharmacy.lga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            LGA <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={lgas}
                              onChange={(selected) => {
                                field.onChange(selected?.value || '');
                              }}
                              value={lgas.find((option) => option.value === field.value) || null}
                              placeholder="Select LGA"
                              isDisabled={!form.watch('pharmacy.state')}
                              styles={selectStyles}
                              isClearable
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* GPS Location Capture */}
                  <PharmacyGPSCaptureUI 
                    gpsCapture={gpsCapture}
                    onCapture={handleCaptureLocation}
                    onClear={gpsCapture.clearLocation}
                  />

                  {/* Phone & License */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="pharmacy.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Phone <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-12 sm:h-14 text-base rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* License Number */}
                    <FormField
                      control={form.control}
                      name="pharmacy.licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            License Number <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-12 sm:h-14 text-base rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-4 sm:space-y-6 pt-4 border-t-2 border-gray-100">
                  <h3 className="text-lg sm:text-xl font-bold text-[#225F91]">Manager Account</h3>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="user.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Full Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 sm:h-14 text-base rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="user.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email address here"
                            className="h-12 sm:h-14 text-base rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* PIN */}
                  <FormField
                    control={form.control}
                    name="user.pin"
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
                                className="w-10 h-12 sm:w-12 sm:h-14 p-0 text-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-lg border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-2 focus:ring-[#1ABA7F]/20 focus:outline-none transition-all"
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600 text-center">
                          Use a 6-digit PIN for quick and secure access
                        </FormDescription>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !gpsCapture.location || gpsCapture.location.quality === 'poor'}
                  className="h-12 sm:h-14 text-base font-bold rounded-lg bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Pharmacy'
                  )}
                </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/pharmacy-login')}
                    className="h-12 text-base font-medium text-[#225F91] hover:text-[#1ABA7F] hover:bg-green-50"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Already have an account? Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs sm:text-sm text-gray-600 mt-6 px-4">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}