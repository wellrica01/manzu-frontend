'use client';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, File, Loader2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function PrescriptionUploadForm() {
  const [file, setFile] = useState(null);
  const [patientIdentifier, setPatientIdentifier] = useState(uuidv4());
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const fileInputRef = useRef(null);

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', patientIdentifier);
  }

  const validateEmail = (email) => {
    return email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : true;
  };

  const validatePhone = (phone) => {
    return phone ? /^\+?\d{10,15}$/.test(phone) : true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && ['application/pdf', 'image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      toast.error('Please upload a valid PDF, JPG, or PNG file', { duration: 4000 });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && ['application/pdf', 'image/jpeg', 'image/png'].includes(droppedFile.type)) {
      setFile(droppedFile);
      fileInputRef.current.files = e.dataTransfer.files;
    } else {
      toast.error('Please upload a valid PDF, JPG, or PNG file', { duration: 4000 });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file', { duration: 4000 });
      return;
    }
    if (!email && !phone) {
      toast.error('Please provide an email or phone number for notifications', { duration: 4000 });
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address', { duration: 4000 });
      return;
    }
    if (!validatePhone(phone)) {
      toast.error('Please enter a valid phone number (10-15 digits)', { duration: 4000 });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('prescriptionFile', file);
    formData.append('patientIdentifier', patientIdentifier);
    if (email) formData.append('email', email);
    if (phone) formData.append('phone', phone);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescription/upload`, {
        method: 'POST',
        headers: { 'x-guest-id': patientIdentifier },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      const data = await response.json();
      setOpenSuccessDialog(true);
      // Track upload (placeholder)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'upload_prescription', { patientIdentifier });
      }
      setFile(null);
      setPatientIdentifier(uuidv4());
      setEmail('');
      setPhone('');
      fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAnother = () => {
    setOpenSuccessDialog(false);
    setFile(null);
    setPatientIdentifier(uuidv4());
    setEmail('');
    setPhone('');
    fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-full sm:max-w-md mx-auto space-y-4">
      {/* Success Dialog */}
      <Dialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              Prescription Uploaded
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground">
              Your prescription has been successfully uploaded. We’ll notify you via {email || phone} once it’s processed.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleUploadAnother}
              className="w-full sm:w-auto"
              aria-label="Upload another prescription"
            >
              Upload Another
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/track" aria-label="Track order">
                Track Order
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form
        onSubmit={handleSubmit}
        className="card p-6 space-y-4"
        role="form"
        aria-labelledby="prescription-upload-title"
      >
        <h2
          id="prescription-upload-title"
          className="text-xl font-semibold text-primary"
        >
          Upload Your Prescription
        </h2>
        <p className="text-muted-foreground text-xs flex items-center">
          <File className="h-4 w-4 mr-2 text-secondary" />
          Securely upload your prescription and we’ll deliver your medications.
        </p>

        {/* Guest ID */}
        <div>
          <Label htmlFor="patientIdentifier" className="text-primary font-medium text-sm">
            Guest ID
          </Label>
          <Input
            id="patientIdentifier"
            type="text"
            value={patientIdentifier}
            readOnly
            className="mt-1 w-full bg-muted text-sm"
            aria-describedby="patient-identifier-help"
          />
          <p id="patient-identifier-help" className="mt-1 text-xs text-muted-foreground">
            Your unique ID for this session
          </p>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-primary font-medium text-sm">
            Email (Optional)
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 w-full pl-10 text-sm"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-primary font-medium text-sm">
            Phone (Optional)
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="mt-1 w-full pl-10 text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Provide email or phone for updates
          </p>
        </div>

        {/* File Upload */}
        <div>
          <Label htmlFor="fileInput" className="text-primary font-medium text-sm">
            Prescription File (PDF, JPG, PNG)
          </Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mt-2 w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors duration-300"
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
              <Upload className="h-8 w-8 text-secondary mb-2" aria-hidden="true" />
              {file ? (
                <p className="text-foreground text-sm flex items-center">
                  <File className="h-4 w-4 mr-2 text-secondary" />
                  {file.name}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
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
          className="w-full text-sm disabled:bg-muted disabled:cursor-not-allowed"
          aria-label="Upload prescription"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Prescription
            </>
          )}
        </Button>
      </form>
    </div>
  );
}