// PrescriptionUploadForm.jsx
'use client';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, File, Loader2, Mail, Phone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function PrescriptionUploadForm() {
  const [file, setFile] = useState(null);
  const [patientIdentifier, setPatientIdentifier] = useState(uuidv4());
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Store guestId in localStorage
  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', patientIdentifier);
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && ['application/pdf', 'image/jpeg', 'image/png'].includes(droppedFile.type)) {
      setFile(droppedFile);
      setError('');
      fileInputRef.current.files = e.dataTransfer.files;
    } else {
      setError('Please upload a valid PDF, JPG, or PNG file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!email && !phone) {
      setError('Please provide an email or phone number for notifications');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('prescriptionFile', file);
    formData.append('patientIdentifier', patientIdentifier);
    if (email) formData.append('email', email);
    if (phone) formData.append('phone', phone);
    try {
      const response = await fetch('http://localhost:5000/api/prescription/upload', {
        method: 'POST',
        headers: { 'x-guest-id': patientIdentifier },
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
      setEmail('');
      setPhone('');
      fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow-md"
        aria-labelledby="prescription-upload-title"
      >
        <h2
          id="prescription-upload-title"
          className="text-2xl font-semibold text-teal-800"
        >
          Upload Your Prescription
        </h2>
        <p className="text-gray-500 text-sm flex items-center">
          <File className="h-5 w-5 mr-2" />
          We’ll check your prescription and send you the medications.
        </p>

        {/* Guest ID */}
        <div>
          <Label htmlFor="patientIdentifier" className="text-teal-700 font-medium">
            Guest ID
          </Label>
          <Input
            id="patientIdentifier"
            type="text"
            value={patientIdentifier}
            readOnly
            className="mt-1 w-full bg-gray-100 border border-gray-200 rounded-lg shadow-sm"
            aria-describedby="patient-identifier-help"
          />
          <p id="patient-identifier-help" className="mt-1 text-sm text-gray-500">
            Your unique ID for this session
          </p>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-teal-700 font-medium">
            Email (Optional)
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-500" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-teal-700 font-medium">
            Phone (Optional)
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-500" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="mt-1 w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Provide email or phone to get updates
          </p>
        </div>

        {/* File Upload */}
        <div>
          <Label htmlFor="fileInput" className="text-teal-700 font-medium">
            Prescription File (PDF, JPG, PNG)
          </Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mt-1 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-500"
            role="region"
            aria-label="Drag and drop prescription file here"
          >
            <Input
              id="fileInput"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-teal-500 mb-2" aria-hidden="true" />
              {file ? (
                <p className="text-gray-700 flex items-center">
                  <File className="h-5 w-5 mr-2" />
                  {file.name}
                </p>
              ) : (
                <p className="text-gray-500">
                  Drag your prescription here or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    browse
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isUploading || !file}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 rounded-lg disabled:bg-gray-300"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Prescription
            </>
          )}
        </Button>
      </form>

      {message && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
          <p className="text-green-700 font-medium">{message}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}