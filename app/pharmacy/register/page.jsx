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
         console.log('Registration successful:', data);
         localStorage.setItem('pharmacyToken', data.token);
         router.push('/pharmacy/dashboard');
       } catch (err) {
         console.error('Registration error:', err);
         setError(err.message);
       }
     };
     return (
       <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold text-indigo-800 mb-4">Pharmacy Registration</h1>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         <Card className="border-indigo-100 shadow-md max-w-lg mx-auto">
           <CardHeader>
             <CardTitle className="text-indigo-800">Register Pharmacy</CardTitle>
           </CardHeader>
           <CardContent>
             <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <div className="space-y-2">
                   <h3 className="text-lg font-semibold text-gray-700">Pharmacy Details</h3>
                   <FormField
                     control={form.control}
                     name="pharmacy.name"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Pharmacy Name</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="pharmacy.address"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Address</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="pharmacy.lga"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Local Government Area (LGA)</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="pharmacy.state"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>State</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="pharmacy.phone"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Phone</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="pharmacy.licenseNumber"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>License Number</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-lg font-semibold text-gray-700">User Details</h3>
                   <FormField
                     control={form.control}
                     name="user.name"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Name</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="user.email"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Email</FormLabel>
                         <FormControl>
                           <Input className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="user.password"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Password</FormLabel>
                         <FormControl>
                           <Input type="password" className="border-indigo-300" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
                 <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                   Register
                 </Button>
               </form>
             </Form>
             <Button
               variant="link"
               className="mt-4 text-indigo-600"
               onClick={() => router.push('/pharmacy/login')}
             >
               Already registered? Login
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }