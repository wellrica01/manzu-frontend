'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, CheckCircle, Clock, FileText, ArrowRight, Phone, X, Eye, Camera, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import ConsentModal from '@/components/ConsentModal';
import { useConsentCheck } from '@/hooks/useConsentCheck';

export default function PrescriptionUploadForm() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [contact, setContact] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [userIdentifier, setuserIdentifier] = useState('');
  const [errors, setErrors] = useState({});
  const [submittedContact, setSubmittedContact] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [contactFocused, setContactFocused] = useState(false);
  const fileInputRef = useRef(null);

  const { isConsentOpen, checkConsent, handleConsentClose } = useConsentCheck();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getGuestId();
      setuserIdentifier(id);
    }
  }, []);

  const validateContact = (contact) => {
    if (!contact) return false;
    if (/^\+?\d{10,15}$/.test(contact)) return true;
    return false;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!file) newErrors.file = t('upload.errors.file_required', 'Prescription file is required');
    if (!contact) newErrors.contact = t('upload.errors.contact_required', 'Contact information is required');
    if (contact && !validateContact(contact))
      newErrors.contact = t('upload.errors.invalid_contact', 'Please enter a valid phone number');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

   if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Please upload a file smaller than 5MB.', {
        duration: 5000,
      });
      return;
    }

    if (
      selectedFile &&
      ['application/pdf', 'image/jpeg', 'image/png'].includes(selectedFile.type)
    ) {
      setFile(selectedFile);
      setErrors((prev) => ({ ...prev, file: null }));
      createFilePreview(selectedFile);
    } else {
      toast.error(t('upload.errors.invalid_file', 'Please upload a PDF, JPG, or PNG file'));
    }
  };

  const createFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      ['application/pdf', 'image/jpeg', 'image/png'].includes(droppedFile.type)
    ) {
      setFile(droppedFile);
      fileInputRef.current.files = e.dataTransfer.files;
      setErrors((prev) => ({ ...prev, file: null }));
      createFilePreview(droppedFile);
    } else {
      toast.error(t('upload.errors.invalid_file', 'Please upload a PDF, JPG, or PNG file'));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setShowFilePreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors((prev) => ({ ...prev, file: null }));
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Camera className="h-5 w-5 text-[#1ABA7F]" strokeWidth={2} />;
    return <FileText className="h-5 w-5 text-[#225F91]" strokeWidth={2} />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

   // Check consent before validation
    if (!checkConsent()) {
      toast.error('Please accept our privacy policy before uploading prescriptions');
      return;
    }

    setIsUploading(true);

    if (!validateForm()) {
      toast.error(t('upload.errors.fix_errors', 'Please fix the errors before submitting'));
      setIsUploading(false);
      return;
    }
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('prescriptionFile', file);
    formData.append('contact', contact);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setSubmittedContact(contact);
          setOpenSuccessDialog(true);
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'upload_prescription', { userIdentifier });
          }
          removeFile();
          setContact('');
          setErrors({});
        } else {
          let errorData = {};
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          toast.error(errorData.message || t('upload.errors.upload_failed', 'Upload failed. Please try again.'));
        }
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast.error(t('upload.errors.upload_failed', 'Upload failed. Please try again.'));
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/upload`);
      xhr.setRequestHeader('x-guest-id', userIdentifier);
      xhr.send(formData);
    } catch (err) {
      toast.error(err.message || t('upload.errors.upload_failed', 'Upload failed. Please try again.'));
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadAnother = () => {
    setOpenSuccessDialog(false);
    setSubmittedContact('');
    removeFile();
    setContact('');
    setErrors({});
  };

  return (
    <div className="w-full">
      {/* Success Dialog */}
     <Dialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] mx-auto p-3 sm:p-6 overflow-y-auto rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xl">
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#1ABA7F] to-[#16a876] p-6 sm:p-10 text-white overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="text-center">
              <DialogTitle className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                Prescription Uploaded Successfully
              </DialogTitle>
              <p className="text-sm sm:text-base text-white/90 font-medium">
                We've received your prescription
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Confirmation Details */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-[#1ABA7F]/10 rounded-lg flex-shrink-0">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-[#1ABA7F]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Confirmation sent to</p>
                <p className="text-sm sm:text-base font-bold text-[#225F91] break-all">{submittedContact}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#225F91]" strokeWidth={2} />
              <h3 className="text-sm sm:text-base font-bold text-gray-900">What happens next?</h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {[
                'Our pharmacists will review your prescription',
                `You'll receive updates via SMS`,
                'Track your prescription status anytime'
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1ABA7F] mt-2 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3 pt-2">
            <Button
              asChild
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-lg bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white shadow-md sm:shadow-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2"
            >
              <Link href="/check-prescription-status">
                <Clock className="h-4 w-4 sm:h-5" strokeWidth={2} />
                Check Prescription Status
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" strokeWidth={2.5} />
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={handleUploadAnother}
              className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300"
            >
              Close
            </Button>
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] sm:text-xs text-center text-gray-500">
              Questions? Contact our support team anytime for assistance
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>


      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-8 p-2">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fileInput" className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#1ABA7F]" strokeWidth={2} />
              Prescription Document
            </Label>
            {file && (
              <Badge className="bg-[#1ABA7F] text-white border-0 px-3 py-1 text-xs font-semibold">
                <CheckCircle className="h-3 w-3 mr-1" strokeWidth={2.5} />
                Ready
              </Badge>
            )}
          </div>
          
          {/* File Preview Card */}
          {file && (
            <div className="p-5 border-2 border-gray-200 rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {getFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {filePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilePreview(!showFilePreview)}
                      className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4 text-gray-600" strokeWidth={2} />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 text-red-500"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </Button>
                </div>
              </div>
              
              {showFilePreview && filePreview && (
                <div className="mt-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <img 
                    src={filePreview} 
                    alt="File preview" 
                    className="w-full h-auto max-h-48 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Upload Area */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative p-12 border-2 border-dashed rounded-2xl text-center transition-all duration-300",
                isDragOver
                  ? "border-[#1ABA7F] bg-[#1ABA7F]/5 shadow-lg scale-[1.01]"
                  : "border-gray-300 bg-gray-50 hover:border-[#1ABA7F]/50 hover:bg-white"
              )}
            >
              <Input
                id="fileInput"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "p-4 rounded-2xl transition-all duration-300",
                  isDragOver ? "bg-[#1ABA7F]/20 scale-110" : "bg-[#1ABA7F]/10"
                )}>
                  <Upload className={cn(
                    "h-10 w-10 transition-colors duration-300",
                    isDragOver ? "text-[#1ABA7F]" : "text-gray-600"
                  )} strokeWidth={2} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-base font-bold text-gray-900">
                    {isDragOver ? "Drop your file here" : "Drag & drop your prescription"}
                  </p>
                  <p className="text-sm text-gray-600">
                    or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="text-[#225F91] hover:text-[#1ABA7F] font-bold underline underline-offset-2 transition-colors"
                    >
                      browse files
                    </button>
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <Badge variant="outline" className="border-gray-300 text-gray-600 font-medium">
                    PDF, JPG, PNG
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-600 font-medium">
                    Max 10MB
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {errors.file && (
            <p className="text-sm text-red-600 font-medium flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
              {errors.file}
            </p>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-[#1ABA7F]/5 to-white border border-[#1ABA7F]/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-semibold flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1ABA7F] border-t-transparent"></div>
                Uploading prescription...
              </span>
              <span className="text-[#225F91] font-bold">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Contact Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="contact" className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#1ABA7F]" strokeWidth={2} />
              Phone Number
            </Label>
            {contact && validateContact(contact) && (
              <Badge className="bg-[#1ABA7F] text-white border-0 px-3 py-1 text-xs font-semibold">
                <CheckCircle className="h-3 w-3 mr-1" strokeWidth={2.5} />
                Valid
              </Badge>
            )}
          </div>
          
          <div className="relative">
            <Phone
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300",
                contactFocused ? "text-[#1ABA7F]" : "text-gray-400"
              )}
              strokeWidth={2}
            />
            <Input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setErrors((prev) => ({ ...prev, contact: null }));
              }}
              onFocus={() => setContactFocused(true)}
              onBlur={() => setContactFocused(false)}
              placeholder="e.g., +2348012345678"
              className={cn(
                "h-14 pl-12 pr-4 text-base font-medium rounded-lg border-2 transition-all duration-300",
                errors.contact
                  ? "border-red-300 focus:border-red-500"
                  : contactFocused
                  ? "border-[#1ABA7F] shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              )}
            />
          </div>
          
          {errors.contact && (
            <p className="text-sm text-red-600 font-medium flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
              {errors.contact}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isUploading || !file || !contact}
          className="group w-full h-14 px-6 text-base font-bold rounded-lg bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" strokeWidth={2} />
              Upload Prescription
            </>
          )}
        </Button>
      </form>
       {/* Add Consent Modal */}
      <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
    </div>
  );
}