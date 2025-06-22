'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Upload, CheckCircle, File as FileIcon, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';
import Link from 'next/link';

export default function TestOrderUploadForm() {
  const [file, setFile] = useState(null);
  const [contact, setContact] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [errors, setErrors] = useState({});
  const [submittedContact, setSubmittedContact] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getGuestId();
      setPatientIdentifier(id);
    }
  }, []);

  const validateContact = (contact) => {
    if (!contact) return false;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return true;
    if (/^\+?\d{10,15}$/.test(contact)) return true;
    return false;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!file) newErrors.file = 'Please select a test order file';
    if (!contact) newErrors.contact = 'Please provide an email or phone number';
    if (contact && !validateContact(contact))
      newErrors.contact = 'Please enter a valid email or phone number (10-15 digits)';
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
    formData.append('testOrderFile', file);
    formData.append('contact', contact);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/test-order/upload`,
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

      setSubmittedContact(contact);
      setOpenSuccessDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'upload_test_order', { patientIdentifier });
      }
      setFile(null);
      setContact('');
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
    setSubmittedContact('');
    setFile(null);
    setContact('');
    fileInputRef.current.value = '';
    setErrors({});
  };

  return (
    <div className="p-8">
      <Dialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
        <DialogContent
          className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
        >
          <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
          <DialogHeader className="flex flex-col items-center gap-3">
            <CheckCircle
              className="h-12 w-12 text-green-500 animate-[pulse_1s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
              Test Order Uploaded!
            </DialogTitle>
          </DialogHeader>
          <p className="mt-4 text-base font-medium text-center text-gray-600">
            Your test order has been successfully submitted. We’ll notify you at{' '}
            <span className="font-semibold text-gray-900" aria-label="Contact method">
              {submittedContact}
            </span>{' '}
            once it's processed.
          </p>
          <p className="mt-3 text-base font-medium text-center text-gray-600">
            Verification usually takes a few minutes. You can also{' '}
            <a
              href="/test"
              className="font-semibold text-primary underline hover:text-primary/80"
              aria-label="Check test order status"
            >
              check your status here
            </a>
            .
          </p>
          <DialogFooter className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleUploadAnother}
              className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
              aria-label="Upload another test order"
            >
              Upload Another
            </Button>
            <Button
              asChild
              className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
            >
              <Link href="/test/track" aria-label="Track test order">
                Track Order
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardContent className="p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-8"
            role="form"
            aria-labelledby="form-title"
          >
            <h2
              id="form-title"
              className="text-2xl font-extrabold text-primary tracking-tight"
            >
              Upload Your Test Order
            </h2>
            <div>
              <Label
                htmlFor="contact"
                className="text-sm font-semibold text-primary uppercase tracking-wider"
              >
                Email or Phone
              </Label>
              <div className="relative mt-2">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70 transition-transform duration-300 group-focus-within:scale-110"
                  aria-hidden="true"
                />
                <Input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setErrors((prev) => ({ ...prev, contact: null }));
                  }}
                  placeholder="Enter your email or phone number"
                  className="h-14 pl-12 text-lg font-medium rounded-2xl border border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                  aria-invalid={!!errors.contact}
                  aria-describedby={errors.contact ? 'contact-error' : undefined}
                />
              </div>
              {errors.contact && (
                <p id="contact-error" className="mt-2 text-sm text-red-600 font-medium">
                  {errors.contact}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="fileInput"
                className="text-sm font-semibold text-primary uppercase tracking-wider"
              >
                Test Order File
              </Label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="mt-3 p-8 border-2 border-dashed border-gray-200/50 rounded-2xl text-center bg-white/95 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300"
                role="region"
                aria-label="Drag and drop test order file"
              >
                <Input
                  id="fileInput"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <Upload
                    className="h-10 w-10 text-primary/70 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  {file ? (
                    <div className="flex items-center gap-3 animate-in fade-in-20 duration-300">
                      <FileIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                      <span className="text-base font-medium text-gray-900 truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-base text-gray-600 font-medium">
                      Drop your file here or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-primary hover:text-primary/80 font-semibold underline transition-colors duration-200"
                      >
                        browse
                      </button>
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Supports .pdf, .jpg, .jpeg, .png
                  </p>
                </div>
              </div>
              {errors.file && (
                <p id="file-error" className="mt-2 text-sm text-red-600 font-medium">
                  {errors.file}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isUploading || !file || !contact}
              className="w-full h-14 px-6 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-6 w-6"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="h-6 w-6" aria-hidden="true" />
                  Upload Test Order
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}