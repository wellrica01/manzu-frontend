'use client';
   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';
   import { jwtDecode } from 'jwt-decode';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Input } from '@/components/ui/input';
   import { Label } from '@/components/ui/label';
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
   export default function PharmacyInventory() {
     const [medications, setMedications] = useState([]);
     const [availableMedications, setAvailableMedications] = useState([]);
     const [form, setForm] = useState({ medicationId: '', stock: '', price: '' });
     const [editingKey, setEditingKey] = useState(null);
     const [editForm, setEditForm] = useState({ stock: '', price: '' });
     const [error, setError] = useState(null);
     const [pharmacyId, setPharmacyId] = useState(null);
     const router = useRouter();
     useEffect(() => {
       const token = localStorage.getItem('token');
       if (!token) {
         router.push('/pharmacy/login');
         return;
       }
       try {
         const decoded = jwtDecode(token);
         setPharmacyId(decoded.pharmacyId);
       } catch (err) {
         console.error('Invalid token:', err);
         localStorage.removeItem('token');
         router.push('/pharmacy/login');
       }
     }, [router]);
     const fetchMedications = async () => {
       if (!pharmacyId) return;
       try {
         setError(null);
         const token = localStorage.getItem('token');
         const response = await fetch(`http://localhost:5000/api/pharmacy/medications`, {
           headers: { Authorization: `Bearer ${token}` },
         });
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to fetch medications');
         }
         const data = await response.json();
         console.log('Pharmacy medications:', data);
         data.medications.forEach(med => console.log('Medication Key:', `${med.pharmacyId}-${med.medicationId}`));
         setMedications(data.medications);
         setAvailableMedications(data.availableMedications);
       } catch (err) {
         console.error('Fetch medications error:', err);
         setError(err.message);
         if (err.message.includes('Invalid token')) {
           localStorage.removeItem('token');
           router.push('/pharmacy/login');
         }
       }
     };
     useEffect(() => {
       fetchMedications();
     }, [pharmacyId]);
     const handleFormChange = (e) => {
       setForm({ ...form, [e.target.name]: e.target.value });
     };
     const handleEditFormChange = (e) => {
       setEditForm({ ...editForm, [e.target.name]: e.target.value });
     };
     const handleAddMedication = async (e) => {
       e.preventDefault();
       try {
         setError(null);
         const token = localStorage.getItem('token');
         const response = await fetch(`http://localhost:5000/api/pharmacy/medications`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${token}`,
           },
           body: JSON.stringify({ ...form, pharmacyId }),
         });
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to add medication');
         }
         console.log('Medication added:', form);
         setForm({ medicationId: '', stock: '', price: '' });
         fetchMedications();
       } catch (err) {
         console.error('Add medication error:', err);
         setError(err.message);
         if (err.message.includes('Invalid token')) {
           localStorage.removeItem('token');
           router.push('/pharmacy/login');
         }
       }
     };
     const handleEditMedication = async (med) => {
       try {
         setError(null);
         const token = localStorage.getItem('token');
         const response = await fetch(`http://localhost:5000/api/pharmacy/medications`, {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${token}`,
           },
           body: JSON.stringify({ pharmacyId, medicationId: med.medicationId, ...editForm }),
         });
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to update medication');
         }
         console.log('Medication updated:', { pharmacyId, medicationId: med.medicationId, ...editForm });
         setEditingKey(null);
         setEditForm({ stock: '', price: '' });
         fetchMedications();
       } catch (err) {
         console.error('Update medication error:', err);
         setError(err.message);
         if (err.message.includes('Invalid token')) {
           localStorage.removeItem('token');
           router.push('/pharmacy/login');
         }
       }
     };
     const handleDeleteMedication = async (med) => {
       try {
         setError(null);
         const token = localStorage.getItem('token');
         const response = await fetch(`http://localhost:5000/api/pharmacy/medications?medicationId=${med.medicationId}`, {
           method: 'DELETE',
           headers: { Authorization: `Bearer ${token}` },
         });
         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to delete medication');
         }
         console.log('Medication deleted:', { pharmacyId, medicationId: med.medicationId });
         fetchMedications();
       } catch (err) {
         console.error('Delete medication error:', err);
         setError(err.message);
         if (err.message.includes('Invalid token')) {
           localStorage.removeItem('token');
           router.push('/pharmacy/login');
         }
       }
     };
     const startEditing = (med) => {
       setEditingKey(`${med.pharmacyId}-${med.medicationId}`);
       setEditForm({ stock: med.stock.toString(), price: med.price.toString() });
     };
     const handleLogout = () => {
       localStorage.removeItem('token');
       router.push('/pharmacy/login');
     };
     return (
       <div className="container mx-auto p-4">
         <div className="flex justify-between items-center mb-4">
           <h1 className="text-2xl font-bold text-indigo-800">Pharmacy Inventory</h1>
           <Button
             onClick={handleLogout}
             className="bg-red-600 hover:bg-red-700 text-white"
           >
             Logout
           </Button>
         </div>
         {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
         <Card className="border-indigo-100 shadow-md mb-6">
           <CardHeader>
             <CardTitle className="text-indigo-800">Add New Medication</CardTitle>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleAddMedication} className="space-y-4">
               <div>
                 <Label htmlFor="medicationId" className="text-gray-700">Medication</Label>
                 <Select
                   name="medicationId"
                   value={form.medicationId}
                   onValueChange={(value) => setForm({ ...form, medicationId: value })}
                 >
                   <SelectTrigger className="border-indigo-300">
                     <SelectValue placeholder="Select medication" />
                   </SelectTrigger>
                   <SelectContent>
                     {availableMedications.map((med) => (
                       <SelectItem key={med.id} value={med.id.toString()}>
                         {med.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label htmlFor="stock" className="text-gray-700">Stock</Label>
                 <Input
                   id="stock"
                   name="stock"
                   type="number"
                   value={form.stock}
                   onChange={handleFormChange}
                   className="border-indigo-300"
                   min="0"
                   required
                 />
               </div>
               <div>
                 <Label htmlFor="price" className="text-gray-700">Price (₦)</Label>
                 <Input
                   id="price"
                   name="price"
                   type="number"
                   step="0.01"
                   value={form.price}
                   onChange={handleFormChange}
                   className="border-indigo-300"
                   min="0"
                   required
                 />
               </div>
               <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                 Add Medication
               </Button>
             </form>
           </CardContent>
         </Card>
         <Card className="border-indigo-100 shadow-md">
           <CardHeader>
             <CardTitle className="text-indigo-800">Inventory</CardTitle>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="text-indigo-800">Medication</TableHead>
                   <TableHead className="text-indigo-800">Stock</TableHead>
                   <TableHead className="text-indigo-800">Price (₦)</TableHead>
                   <TableHead className="text-indigo-800">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {medications.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={4} className="text-gray-600 text-center">
                       No medications in inventory.
                     </TableCell>
                   </TableRow>
                 ) : (
                   medications.map((med) => (
                     <TableRow key={`${med.pharmacyId}-${med.medicationId}`}>
                       <TableCell>{med.name}</TableCell>
                       <TableCell>
                         {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                           <Input
                             name="stock"
                             type="number"
                             value={editForm.stock}
                             onChange={handleEditFormChange}
                             className="border-indigo-300 w-20"
                             min="0"
                           />
                         ) : (
                           med.stock
                         )}
                       </TableCell>
                       <TableCell>
                         {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                           <Input
                             name="price"
                             type="number"
                             step="0.01"
                             value={editForm.price}
                             onChange={handleEditFormChange}
                             className="border-indigo-300 w-24"
                             min="0"
                           />
                         ) : (
                           `₦${med.price}`
                         )}
                       </TableCell>
                       <TableCell>
                         {editingKey === `${med.pharmacyId}-${med.medicationId}` ? (
                           <>
                             <Button
                               onClick={() => handleEditMedication(med)}
                               className="bg-green-600 hover:bg-green-700 text-white mr-2"
                             >
                               Save
                             </Button>
                             <Button
                               onClick={() => setEditingKey(null)}
                               className="bg-gray-600 hover:bg-gray-700 text-white"
                             >
                               Cancel
                             </Button>
                           </>
                         ) : (
                           <>
                             <Button
                               onClick={() => startEditing(med)}
                               className="bg-indigo-600 hover:bg-indigo-700 text-white mr-2"
                             >
                               Edit
                             </Button>
                             <Button
                               onClick={() => handleDeleteMedication(med)}
                               className="bg-red-600 hover:bg-red-700 text-white"
                             >
                               Delete
                             </Button>
                           </>
                         )}
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
             <Button
               className="bg-green-600 hover:bg-green-700 text-white mt-4"
               onClick={() => router.push('/pharmacy/dashboard')}
             >
               Back to Dashboard
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }