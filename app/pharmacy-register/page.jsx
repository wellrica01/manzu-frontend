'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { usePharmacyGPSCapture } from '@/hooks/usePharmacyGPSCapture';
import { Input } from '@/components/ui/input';
import { UserPlus, LogIn, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Select from 'react-select';
import Image from 'next/image';
import { toast } from 'sonner';

// âœ… Import the API client
import { pharmacyAuthAPI, setPharmacyToken } from '@/lib/pharmacyApiClient';
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
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
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
      
      // Show quality-based feedback
      if (location.quality === 'excellent') {
        toast.success(
          `Excellent GPS accuracy: ${location.accuracy}m`,
          {
            description: `Based on ${location.sampleCount} readings with ${location.consistency}m consistency`,
            duration: 5000,
          }
        );
      } else if (location.quality === 'good') {
        toast.success(
          `Good GPS accuracy: ${location.accuracy}m`,
          {
            description: 'Location captured successfully',
            duration: 4000,
          }
        );
      } else if (location.quality === 'acceptable') {
        toast.warning(
          `GPS accuracy: ${location.accuracy}m`,
          {
            description: 'Accuracy is acceptable. For best results, move outdoors.',
            duration: 5000,
          }
        );
      } else {
        toast.warning(
          `Low GPS accuracy: ${location.accuracy}m`,
          {
            description: 'Consider recapturing outdoors for better accuracy',
            duration: 6000,
          }
        );
      }

    } catch (err) {
      console.error('GPS capture error:', err);
      // Error is already set in the hook
    }
  };



  // âœ… Updated submit handler using API client
  const onSubmit = async (values) => {
    // Validate GPS was captured
    if (!gpsCapture.location) {
      toast.error('Please capture your pharmacy location using GPS');
      return;
    }

    // Warn if accuracy is poor
    if (gpsCapture.location.quality === 'poor') {
      toast.error('GPS accuracy is too low. Please recapture location outdoors.');
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
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
                            placeholder="e.g., HealthPlus Pharmacy"
                            className="h-12 sm:h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
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
                            placeholder="e.g., 123 Market Road, Near First Bank"
                            className="h-12 sm:h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
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
              <div className="space-y-3">
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Pharmacy Location (GPS) <span className="text-red-500">*</span>
                </FormLabel>
                
                {!gpsCapture.location ? (
                  <>
                    <Button
                      type="button"
                      onClick={handleCaptureLocation}
                      disabled={gpsCapture.isCapturing}
                      className="w-full h-12 sm:h-14 text-base font-semibold rounded-xl bg-[#1ABA7F] hover:bg-[#1ABA7F]/90 text-white transition-all"
                    >
                      {gpsCapture.isCapturing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Capturing Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-5 w-5 mr-2" />
                          Capture My Location
                        </>
                      )}
                    </Button>

                    {/* Progress Indicator */}
                    {gpsCapture.isCapturing && gpsCapture.progress && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-blue-900">
                            Collecting samples {gpsCapture.progress.current}/{gpsCapture.progress.total}
                          </span>
                          {gpsCapture.progress.accuracy && (
                            <span className={`font-medium ${
                              gpsCapture.progress.accuracy < 30 ? 'text-green-600' : 
                              gpsCapture.progress.accuracy < 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {Math.round(gpsCapture.progress.accuracy)}m
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${(gpsCapture.progress.current / gpsCapture.progress.total) * 100}%` 
                            }}
                          />
                        </div>

                        {/* Status message */}
                        <p className="text-xs text-blue-700">
                          {gpsCapture.progress.status === 'success' && 'Good signal quality'}
                          {gpsCapture.progress.status === 'poor_signal' && 'Weak signal - move outdoors'}
                          {gpsCapture.progress.status === 'starting' && 'Initializing GPS...'}
                          {gpsCapture.progress.status === 'error' && 'Reading failed, retrying...'}
                          {gpsCapture.progress.samplesCollected > 0 && 
                            ` â€¢ ${gpsCapture.progress.samplesCollected} valid readings`}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`p-4 rounded-xl border-2 ${
                    gpsCapture.location.quality === 'excellent' 
                      ? 'bg-green-50 border-green-200' 
                      : gpsCapture.location.quality === 'good'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        gpsCapture.location.quality === 'excellent' 
                          ? 'text-green-600' 
                          : gpsCapture.location.quality === 'good'
                          ? 'text-blue-600'
                          : 'text-yellow-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold mb-1 ${
                          gpsCapture.location.quality === 'excellent' 
                            ? 'text-green-800' 
                            : gpsCapture.location.quality === 'good'
                            ? 'text-blue-800'
                            : 'text-yellow-800'
                        }`}>
                          Location Captured - {gpsCapture.location.quality.charAt(0).toUpperCase() + 
                            gpsCapture.location.quality.slice(1)} Quality
                        </p>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                          <div>
                            <span className="text-gray-600">Coordinates:</span>
                            <p className="font-mono">
                              {gpsCapture.location.latitude.toFixed(6)}, {gpsCapture.location.longitude.toFixed(6)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Accuracy:</span>
                            <p className="font-medium">Â±{gpsCapture.location.accuracy}m</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Samples:</span>
                            <p className="font-medium">{gpsCapture.location.sampleCount}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Consistency:</span>
                            <p className="font-medium">{gpsCapture.location.consistency}m</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={gpsCapture.clearLocation}
                        className={`flex-shrink-0 ${
                          gpsCapture.location.quality === 'excellent' 
                            ? 'text-green-700 hover:text-green-900 hover:bg-green-100' 
                            : gpsCapture.location.quality === 'good'
                            ? 'text-blue-700 hover:text-blue-900 hover:bg-blue-100'
                            : 'text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100'
                        }`}
                      >
                        Recapture
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {gpsCapture.error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-red-700">{gpsCapture.error}</p>
                  </div>
                )}

                <FormDescription className="text-xs text-gray-600">
                  ðŸ“ High-precision GPS capture (5 readings with outlier filtering)
                  <br />
                  âš¡ For best results: Move outdoors with clear sky view
                </FormDescription>
              </div>

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
                              placeholder="08012345678"
                              className="h-12 sm:h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
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
                              placeholder="PCN12345"
                              className="h-12 sm:h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
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
                            placeholder="John Doe"
                            className="h-12 sm:h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
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
                            placeholder="john@pharmacy.com"
                            className="h-12 sm:h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors"
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
                          <Input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="Enter 6-digit PIN"
                            className="h-12 sm:h-14 text-base rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-0 transition-colors text-center tracking-widest"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600">
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
                  className="h-12 sm:h-14 text-base font-bold rounded-xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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