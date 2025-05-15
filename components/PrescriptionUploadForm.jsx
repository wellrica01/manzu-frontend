'use client';
     import { useState } from 'react';
     import { Input } from '@/components/ui/input';
     import { Button } from '@/components/ui/button';
     import { Label } from '@/components/ui/label';
     import { v4 as uuidv4 } from 'uuid';
     export default function PrescriptionUploadForm() {
       const [file, setFile] = useState(null);
       const [patientIdentifier, setPatientIdentifier] = useState(uuidv4());
       const [message, setMessage] = useState('');
       const [error, setError] = useState('');
       const handleSubmit = async (e) => {
         e.preventDefault();
         setMessage('');
         setError('');
         if (!file) {
           setError('Please select a file');
           return;
         }
         const formData = new FormData();
         formData.append('prescriptionFile', file);
         formData.append('patientIdentifier', patientIdentifier);
         try {
           const response = await fetch('http://localhost:5000/api/prescription/upload', {
             method: 'POST',
             body: formData,
           });
           if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.message || 'Upload failed');
           }
           const data = await response.json();
           setMessage(data.message);
           setFile(null);
           setPatientIdentifier(uuidv4());
           document.getElementById('fileInput').value = '';
         } catch (err) {
           setError(err.message);
         }
       };
       return (
         <div className="space-y-4">
           <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
             <div>
               <Label htmlFor="patientIdentifier" className="text-indigo-700 font-medium">
                 Guest ID
               </Label>
               <Input
                 id="patientIdentifier"
                 type="text"
                 value={patientIdentifier}
                 onChange={(e) => setPatientIdentifier(e.target.value)}
                 placeholder="Enter guest ID"
                 className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
               />
             </div>
             <div>
               <Label htmlFor="fileInput" className="text-indigo-700 font-medium">
                 Prescription File (PDF, JPG, PNG)
               </Label>
               <Input
                 id="fileInput"
                 type="file"
                 accept=".pdf,.jpg,.jpeg,.png"
                 onChange={(e) => setFile(e.target.files[0])}
                 className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
               />
             </div>
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">Upload</Button>
           </form>
           {message && <p className="text-green-600 font-medium">{message}</p>}
           {error && <p className="text-red-600 font-medium">{error}</p>}
         </div>
       );
     }