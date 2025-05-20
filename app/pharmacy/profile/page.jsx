'use client';
   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';
   import { jwtDecode } from 'jwt-decode';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import * as z from 'zod';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
   import { Input } from '@/components/ui/input';
   const editProfileSchema = z.object({
     user: z.object({
       name: z.string().min(1, 'Name is required'),
       email: z.string().email('Invalid email'),
     }),
     pharmacy: z.object({
       name: z.string().min(1, 'Pharmacy name is required'),
       address: z.string().min(1, 'Address is required'),
       lga: z.string().min(1, 'LGA is required'),
       state: z.string().min(1, 'State is required'),
       phone: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
     }),
   });
   export default function PharmacyProfile() {
     const [user, setUser] = useState(null);
     const [pharmacy, setPharmacy] = useState(null);
     const [error, setError] = useState(null);
     const [isEditing, setIsEditing] = useState(false);
     const [userRole, setUserRole] = useState(null);
     const router = useRouter();
     const form = useForm({
       resolver: zodResolver(editProfileSchema),
       defaultValues: {
         user: { name: '', email: '' },
         pharmacy: { name: '', address: '', lga: '', state: '', phone: '' },
       },
     });
     useEffect(() => {
       const token = localStorage.getItem('pharmacyToken');
       if (!token) {
         router.replace('/pharmacy/login');
         return;
       }
       try {
         const decoded = jwtDecode(token);
         setUserRole(decoded.role);
       } catch (err) {
         console.error('Invalid token:', err);
         localStorage.removeItem('pharmacyToken');
         router.replace('/pharmacy/login');
       }
     }, [router]);
     const fetchProfile = async () => {
       try {
         setError(null);
         const token = localStorage.getItem('pharmacyToken');
         if (!token) {
        router.replace('/pharmacy/login');
        return;
      }
         const response = await fetch('http://localhost:5000/api/auth/profile', {
           headers: { Authorization: `Bearer ${token}` },
         });
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to fetch profile');
         }
         const data = await response.json();
         console.log('Profile fetched:', data);
         setUser(data.user);
         setPharmacy(data.pharmacy);
         form.reset({
           user: { name: data.user.name, email: data.user.email },
           pharmacy: {
             name: data.pharmacy.name,
             address: data.pharmacy.address,
             lga: data.pharmacy.lga,
             state: data.pharmacy.state,
             phone: data.pharmacy.phone,
           },
         });
       } catch (err) {
         console.error('Fetch profile error:', err);
         setError(err.message);
         if (err.message.includes('Invalid token')) {
           localStorage.removeItem('pharmacyToken');
           router.replace('/pharmacy/login');
         }
       }
     };
     useEffect(() => {
       if (userRole) {
         fetchProfile();
       }
     }, [userRole]);
     const handleEditProfile = async (values) => {
       try {
         setError(null);
         const token = localStorage.getItem('pharmacyToken');
         if (!token) {
        router.replace('/pharmacy/login');
        return;
      }
         const response = await fetch('http://localhost:5000/api/auth/profile', {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${token}`,
           },
           body: JSON.stringify(values),
         });
         const data = await response.json();
         if (!response.ok) {
           throw new Error(data.message || 'Failed to update profile');
         }
         console.log('Profile updated:', data);
         setUser(data.user);
         setPharmacy(data.pharmacy);
         setIsEditing(false);
       } catch (err) {
         console.error('Edit profile error:', err);
         setError(err.message);
       }
     };
     const handleLogout = () => {
       localStorage.removeItem('pharmacyToken');
       router.push('/pharmacy/login');
     };
     if (!user || !pharmacy) {
       return <div className="container mx-auto p-4">Loading...</div>;
     }
     return (
       <div className="container mx-auto p-4">
         <div className="flex justify-between items-center mb-4">
           <h1 className="text-2xl font-bold text-indigo-800">Pharmacy Profile</h1>
           <Button
             onClick={() => router.push('/pharmacy/dashboard')}
             className="bg-indigo-600 hover:bg-indigo-700 text-white"
           >
             Back to Dashboard
           </Button>
         </div>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         <Card className="border-indigo-100 shadow-md">
           <CardHeader>
             <CardTitle className="text-indigo-800">Profile Details</CardTitle>
           </CardHeader>
           <CardContent>
             {isEditing && userRole === 'manager' ? (
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(handleEditProfile)} className="space-y-6">
                   <div>
                     <h3 className="text-lg font-semibold text-gray-700 mb-2">User Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                     </div>
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-gray-700 mb-2">Pharmacy Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                             <FormLabel>LGA</FormLabel>
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
                     </div>
                   </div>
                   <div className="flex space-x-4">
                     <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                       Save
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       className="border-indigo-300 text-indigo-600 hover:bg-indigo-100"
                       onClick={() => setIsEditing(false)}
                     >
                       Cancel
                     </Button>
                   </div>
                 </form>
               </Form>
             ) : (
               <>
                 <div className="mb-6">
                   <h3 className="text-lg font-semibold text-gray-700 mb-2">User Details</h3>
                   <p><strong>Name:</strong> {user.name}</p>
                   <p><strong>Email:</strong> {user.email}</p>
                   <p><strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                 </div>
                 <div className="mb-6">
                   <h3 className="text-lg font-semibold text-gray-700 mb-2">Pharmacy Details</h3>
                   <p><strong>Name:</strong> {pharmacy.name}</p>
                   <p><strong>Address:</strong> {pharmacy.address}</p>
                   <p><strong>LGA:</strong> {pharmacy.lga}</p>
                   <p><strong>State:</strong> {pharmacy.state}</p>
                   <p><strong>Phone:</strong> {pharmacy.phone}</p>
                   <p><strong>License Number:</strong> {pharmacy.licenseNumber}</p>
                 </div>
                 {userRole === 'manager' && (
                   <Button
                     className="bg-indigo-600 hover:bg-indigo-700 text-white"
                     onClick={() => setIsEditing(true)}
                   >
                     Edit Profile
                   </Button>
                 )}
               </>
             )}
           </CardContent>
         </Card>
         <div className="mt-4">
           <Button
             onClick={handleLogout}
             className="bg-red-600 hover:bg-red-700 text-white"
           >
             Logout
           </Button>
         </div>
       </div>
     );
   }