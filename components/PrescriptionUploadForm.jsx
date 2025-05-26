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
    <div className="max-w-lg mx-auto space-y-6 fade-in">
      <form
        onSubmit={handleSubmit}
        className="card p-8 space-y-6"
        aria-labelledby="prescription-upload-title"
      >
        <h2
          id="prescription-upload-title"
          className="text-2xl font-semibold text-primary"
        >
          Upload Your Prescription
        </h2>
        <p className="text-muted-foreground text-sm flex items-center">
          <File className="h-5 w-5 mr-2 text-secondary" />
          Securely upload your prescription and we’ll deliver your medications.
        </p>

        {/* Guest ID */}
        <div>
          <Label htmlFor="patientIdentifier" className="text-primary font-medium">
            Guest ID
          </Label>
          <Input
            id="patientIdentifier"
            type="text"
            value={patientIdentifier}
            readOnly
            className="mt-1 w-full bg-muted"
            aria-describedby="patient-identifier-help"
          />
          <p id="patient-identifier-help" className="mt-1 text-sm text-muted-foreground">
            Your unique ID for this session
          </p>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-primary font-medium">
            Email (Optional)
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 w-full pl-10"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-primary font-medium">
            Phone (Optional)
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="mt-1 w-full pl-10"
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Provide email or phone for updates
          </p>
        </div>

        {/* File Upload */}
        <div>
          <Label htmlFor="fileInput" className="text-primary font-medium">
            Prescription File (PDF, JPG, PNG)
          </Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mt-2 w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors duration-300"
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
              <Upload className="h-10 w-10 text-secondary mb-3" aria-hidden="true" />
              {file ? (
                <p className="text-foreground flex items-center">
                  <File className="h-5 w-5 mr-2 text-secondary" />
                  {file.name}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Drag your prescription here or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-primary hover:text-secondary font-medium"
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
          className="w-full disabled:bg-muted disabled:cursor-not-allowed"
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
        <div className="card bg-green-50 border-l-4 border-green-400 p-4">
          <p className="text-green-700 font-medium">{message}</p>
        </div>
      )}
      {error && (
        <div className="card bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}