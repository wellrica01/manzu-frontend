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
     email: z.string().email('Invalid email'),
     password: z.string().min(1, 'Password is required'),
   });
   export default function PharmacyLogin() {
     const [error, setError] = useState(null);
     const router = useRouter();
     const form = useForm({
       resolver: zodResolver(formSchema),
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
         console.log('Login successful:', data);
         localStorage.setItem('token', data.token);
         router.push('/pharmacy/dashboard');
       } catch (err) {
         console.error('Login error:', err);
         setError(err.message);
       }
     };
     return (
       <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold text-indigo-800 mb-4">Pharmacy Login</h1>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         <Card className="border-indigo-100 shadow-md max-w-md mx-auto">
           <CardHeader>
             <CardTitle className="text-indigo-800">Login</CardTitle>
           </CardHeader>
           <CardContent>
             <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                   control={form.control}
                   name="email"
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
                   name="password"
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
                 <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                   Login
                 </Button>
               </form>
             </Form>
             <Button
               variant="link"
               className="mt-4 text-indigo-600"
               onClick={() => router.push('/pharmacy/register')}
             >
               Need to register? Sign up
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }