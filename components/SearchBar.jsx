'use client';
     import { useState } from 'react';
     import { Input } from '@/components/ui/input';
     import { Button } from '@/components/ui/button';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     export default function SearchBar() {
       const [searchTerm, setSearchTerm] = useState('');
       const [results, setResults] = useState([]);
       const [error, setError] = useState(null);
       const handleSearch = async () => {
         try {
           setError(null);
           const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchTerm)}`);
           if (!response.ok) {
             throw new Error('Search failed');
           }
           const data = await response.json();
           setResults(data);
         } catch (err) {
           setError(err.message);
           setResults([]);
         }
       };
       return (
         <div className="space-y-4">
           <div className="flex gap-3">
             <Input
               type="text"
               placeholder="Search medications..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="max-w-md border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
             />
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSearch}>Search</Button>
           </div>
           {error && <p className="text-red-500">{error}</p>}
            <div className="grid gap-4">
             {results.length === 0 && !error && searchTerm && (
               <p className="text-gray-600">No medications found.</p>
             )}
             {results.map((med) => (
               <Card key={med.id} className="border-indigo-100 shadow-md hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <CardTitle className="text-indigo-800">{med.name}</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-gray-700"><strong>Generic:</strong> {med.genericName}</p>
                   <p className="text-gray-700"><strong>NAFDAC:</strong> {med.nafdacCode}</p>
                   {med.imageUrl && (
                     <img src={med.imageUrl} alt={med.name} className="w-32 h-32 object-cover my-2 rounded-md" />
                   )}
                   <h3 className="font-semibold text-indigo-700 mt-2">Available at:</h3>
                   <ul className="list-disc pl-5 text-gray-700">
                     {med.availability.map((avail, index) => (
                       <li key={index}>
                         {avail.pharmacyName}: {avail.stock} in stock, ₦{avail.price}
                       </li>
                     ))}
                   </ul>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       );
     }