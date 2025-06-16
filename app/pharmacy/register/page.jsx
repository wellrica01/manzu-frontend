'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UserPlus, LogIn } from 'lucide-react';
import Select from 'react-select';


const formSchema = z.object({
  pharmacy: z.object({
    name: z.string().min(1, 'Pharmacy name is required'),
    address: z.string().min(1, 'Address is required'),
    lga: z.string().min(1, 'LGA is required'),
    state: z.string().min(1, 'State is required'),
    ward: z.string().min(1, 'Ward is required'),
    latitude: z.number().min(-90).max(90, 'Invalid latitude'),
    longitude: z.number().min(-180).max(180, 'Invalid longitude'),
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
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pharmacy: { name: '', address: '', lga: '', state: '',  ward: '',
          latitude: 0, longitude: 0, phone: '', licenseNumber: '' },
      user: { name: '', email: '', password: '' },
    },
  });


    // Load geo data on mount
    useEffect(() => {
        fetch('/data/full.json')
            .then(res => res.json())
            .then(data => {
                setGeoData(data);
                setStates(data.map(state => ({
                    value: state.state,
                    label: state.state,
                })));
            })
            .catch(err => {
                console.error('Failed to load geo data:', err);
                setError('Failed to load location data');
            });
    }, []);

    // Update LGAs when state changes
    const updateLgas = (state) => {
        if (!geoData) return;
        const stateData = geoData.find(s => s.state === state);
        setLgas(stateData ? stateData.lgas.map(lga => ({
            value: lga.name,
            label: lga.name,
        })) : []);
        setWards([]);
        form.setValue('pharmacy.lga', '');
        form.setValue('pharmacy.ward', '');
        form.setValue('pharmacy.latitude', 0);
        form.setValue('pharmacy.longitude', 0);
    };

    // Update wards when LGA changes
    const updateWards = (state, lga) => {
        if (!geoData) return;
        const stateData = geoData.find(s => s.state === state);
        const lgaData = stateData?.lgas.find(l => l.name === lga);
        setWards(lgaData ? lgaData.wards.map(ward => ({
            value: ward.name,
            label: ward.name,
        })) : []);
        form.setValue('pharmacy.ward', '');
        form.setValue('pharmacy.latitude', 0);
        form.setValue('pharmacy.longitude', 0);
    };

    // Update coordinates when ward changes
    const updateCoordinates = (state, lga, ward) => {
        if (!geoData) return;
        const stateData = geoData.find(s => s.state === state);
        const lgaData = stateData?.lgas.find(l => l.name === lga);
        const wardData = lgaData?.wards.find(w => w.name === ward);
        if (wardData) {
            form.setValue('pharmacy.latitude', wardData.latitude);
            form.setValue('pharmacy.longitude', wardData.longitude);
        } else {
            form.setValue('pharmacy.latitude', 0);
            form.setValue('pharmacy.longitude', 0);
        }
    };

    // Handle form submission
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
  <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight text-center mb-10 animate-in slide-in-from-top-10 duration-700">
        Join <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse">Manzu</span> as a Pharmacy
      </h1>
      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
      >
        {/* Decorative Corner Accent */}
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight flex items-center">
            <UserPlus className="h-7 w-7 mr-3 text-primary/80 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            Register Your Pharmacy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="bg-red-50/90 border-l-4 border-red-500 p-4 mb-6 rounded-xl animate-in fade-in-20 duration-300">
              <p className="text-red-600 text-base font-medium">{error}</p>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-primary tracking-tight">Pharmacy Details</h3>
                <FormField
                  control={form.control}
                  name="pharmacy.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Pharmacy Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pharmacy.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pharmacy.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        State
                      </FormLabel>
                      <FormControl>
                        <Select
                          options={states}
                          onChange={(selected) => {
                            field.onChange(selected?.value || '');
                            updateLgas(selected?.value || '');
                          }}
                          value={states.find((option) => option.value === field.value)}
                          placeholder="Select a state"
                          styles={{
                            control: (provided, state) => ({
                              ...provided,
                              border: `1px solid ${state.isFocused ? 'rgba(59,130,246,0.5)' : 'rgba(209,213,219,0.5)'}`,
                              boxShadow: state.isFocused ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                              background: 'rgba(255,255,255,0.95)',
                              borderRadius: '1rem',
                              padding: '0.5rem',
                              height: '3.5rem',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: 'rgba(59,130,246,0.5)',
                                boxShadow: '0 0 15px rgba(59,130,246,0.2)',
                              },
                            }),
                            menu: (provided) => ({
                              ...provided,
                              background: 'rgba(255,255,255,0.95)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(209,213,219,0.5)',
                              borderRadius: '1rem',
                              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            }),
                          }}
                          className="text-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pharmacy.lga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Local Government Area (LGA)
                      </FormLabel>
                      <FormControl>
                        <Select
                          options={lgas}
                          onChange={(selected) => {
                            field.onChange(selected?.value || '');
                            updateWards(form.watch('pharmacy.state'), selected?.value || '');
                          }}
                          value={lgas.find((option) => option.value === field.value)}
                          placeholder="Select an LGA"
                          isDisabled={!form.watch('pharmacy.state')}
                          styles={{
                            control: (provided, state) => ({
                              ...provided,
                              border: `1px solid ${state.isFocused ? 'rgba(59,130,246,0.5)' : 'rgba(209,213,219,0.5)'}`,
                              boxShadow: state.isFocused ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                              background: 'rgba(255,255,255,0.95)',
                              borderRadius: '1rem',
                              padding: '0.5rem',
                              height: '3.5rem',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: 'rgba(59,130,246,0.5)',
                                boxShadow: '0 0 15px rgba(59,130,246,0.2)',
                              },
                            }),
                            menu: (provided) => ({
                              ...provided,
                              background: 'rgba(255,255,255,0.95)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(209,213,219,0.5)',
                              borderRadius: '1rem',
                              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            }),
                          }}
                          className="text-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pharmacy.ward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Ward
                      </FormLabel>
                      <FormControl>
                        <Select
                          options={wards}
                          onChange={(selected) => {
                            field.onChange(selected?.value || '');
                            updateCoordinates(form.watch('pharmacy.state'), form.watch('pharmacy.lga'), selected?.value || '');
                          }}
                          value={wards.find((option) => option.value === field.value)}
                          placeholder="Select a ward"
                          isDisabled={!form.watch('pharmacy.lga')}
                          styles={{
                            control: (provided, state) => ({
                              ...provided,
                              border: `1px solid ${state.isFocused ? 'rgba(59,130,246,0.5)' : 'rgba(209,213,219,0.5)'}`,
                              boxShadow: state.isFocused ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                              background: 'rgba(255,255,255,0.95)',
                              borderRadius: '1rem',
                              padding: '0.5rem',
                              height: '3.5rem',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: 'rgba(59,130,246,0.5)',
                                boxShadow: '0 0 15px rgba(59,130,246,0.2)',
                              },
                            }),
                            menu: (provided) => ({
                              ...provided,
                              background: 'rgba(255,255,255,0.95)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(209,213,219,0.5)',
                              borderRadius: '1rem',
                              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            }),
                          }}
                          className="text-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                {/* Hidden fields for coordinates */}
                <FormField
                  control={form.control}
                  name="pharmacy.latitude"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />
                <FormField
                  control={form.control}
                  name="pharmacy.longitude"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />
                <FormField
                  control={form.control}
                  name="pharmacy.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pharmacy.licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        License Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-primary tracking-tight">User Details</h3>
                <FormField
                  control={form.control}
                  name="user.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className="h-14 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm font-medium mt-2" />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-14 px-6 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300"
              >
                Register Pharmacy
              </Button>
            </form>
          </Form>
          <Button
            variant="link"
            className="mt-6 w-full text-base font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-2 transition-colors duration-300"
            onClick={() => router.push('/pharmacy/login')}
          >
            <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            Already registered? Login
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);
}