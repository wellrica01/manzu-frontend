'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, CheckCircle, File, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function PrescriptionUploadForm() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Persistent identifier logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('guestId');
      if (!id) {
        id = uuidv4();
        localStorage.setItem('guestId', id);
      }
      setPatientIdentifier(id);
    }
  }, []);

  const validateEmail = (email) => {
    return email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : true;
  };

  const validatePhone = (phone) => {
    return phone ? /^\+?\d{10,15}$/.test(phone) : true;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!file) newErrors.file = 'Please select a prescription file';
    if (!email && !phone) newErrors.contact = 'Please provide an email or phone number';
    if (email && !validateEmail(email)) newErrors.email = 'Please enter a valid email address';
    if (phone && !validatePhone(phone)) newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      ['application/pdf', 'image/jpeg', 'image/png'].includes(selectedFile.type)
    ) {
      setFile(selectedFile);
      setErrors((prev) => ({ ...prev, file: null }));
    } else {
      toast.error('Please upload a PDF, JPG, or PNG file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      ['application/pdf', 'image/jpeg', 'image/png'].includes(droppedFile.type)
    ) {
      setFile(droppedFile);
      fileInputRef.current.files = e.dataTransfer.files;
      setErrors((prev) => ({ ...prev, file: null }));
    } else {
      toast.error('Please upload a PDF, JPG, or PNG file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append('prescriptionFile', file);
    if (email) formData.append('email', email);
    if (phone) formData.append('phone', phone);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/upload`,
        {
          method: 'POST',
          headers: { 'x-guest-id': patientIdentifier },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      setOpenSuccessDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'upload_prescription', { patientIdentifier });
      }
      setFile(null);
      setEmail('');
      setPhone('');
      fileInputRef.current.value = '';
      setErrors({});
    } catch (err) {
      console.error('Submission Error:', err);
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAnother = () => {
    setOpenSuccessDialog(false);
    setFile(null);
    setEmail('');
    setPhone('');
    fileInputRef.current.value = '';
    setErrors({});
  };

  return (
    <div className="p-6">
      {/* Success Dialog */}
      <Dialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
        <DialogContent className="sm:max-w-md p-6 shadow-lg">
          <DialogHeader>
            <CheckCircle className="h-10 w-10 mx-auto text-green-500" />
            <DialogTitle className="text-2xl font-semibold text-primary text-center mt-2">
              Success!
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-600">
            Your prescription has been uploaded. We'll notify you via{' '}
            <span className="font-medium">{email || phone}</span> once processed.
          </p>
          <DialogFooter className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={handleUploadAnother}>
              Upload Another
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/track">Track Order</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" role="form" aria-labelledby="form-title">
        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-base font-medium text-primary">
            Email (Optional)
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: null, contact: null }));
              }}
              placeholder="Enter your email"
              className="mt-3 h-12 pl-10 text-base rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-base font-medium text-primary">
            Phone (Optional)
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((prev) => ({ ...prev, phone: null, contact: null }));
              }}
              placeholder="Enter your phone number"
              className="mt-3 h-12 pl-10 text-base rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
          </div>
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-destructive">
              {errors.phone}
            </p>
          )}
          {errors.contact && (
            <p id="contact-error" className="mt-1 text-sm text-destructive">
              {errors.contact}
            </p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <Label htmlFor="fileInput" className="text-base font-medium text-primary">
            Prescription File
          </Label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mt-3 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary transition-colors duration-200"
            role="region"
            aria-label="Drag and drop prescription file"
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
              <Upload className="h-8 w-8 text-gray-400" />
              {file ? (
                <div className="mt-2 flex items-center gap-2">
                  <File className="h-5 w-5 text-primary" />
                  <span className="text-base text-gray-700">{file.name}</span>
                </div>
              ) : (
                <p className="mt-2 text-base text-gray-500">
                  Drop your file here or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    browse
                  </button>
                </p>
              )}
            </div>
          </div>
          {errors.file && (
            <p id="file-error" className="mt-1 text-sm text-destructive">
              {errors.file}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isUploading || !file || (!email && !phone)}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Uploading...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload Prescription
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}