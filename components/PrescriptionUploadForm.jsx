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
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, CheckCircle, File as FileIcon, Mail, X, Eye, Camera, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getGuestId();
      setuserIdentifier(id);
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
    if (!file) newErrors.file = t('upload.errors.file_required');
    if (!contact) newErrors.contact = t('upload.errors.contact_required');
    if (contact && !validateContact(contact))
      newErrors.contact = t('upload.errors.invalid_contact');
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
      createFilePreview(selectedFile);
    } else {
      toast.error(t('upload.errors.invalid_file'));
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
      toast.error(t('upload.errors.invalid_file'));
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
    if (type.startsWith('image/')) return <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-[#225F91]" />;
    return <FileIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#225F91]" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t('upload.errors.fix_errors'));
      return;
    }
    setIsUploading(true);
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
          throw new Error(errorData.message || t('upload.errors.upload_failed'));
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error(t('upload.errors.upload_failed'));
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/upload`);
      xhr.setRequestHeader('x-guest-id', userIdentifier);
      xhr.send(formData);
    } catch (err) {
      toast.error(err.message || t('upload.errors.upload_failed'));
    } finally {
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
      <Dialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
        <DialogContent
          className="w-[95vw] sm:max-w-md p-6 sm:p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg sm:shadow-xl animate-in slide-in-from-top-10 fade-in-20 duration-300"
        >
          <div className="absolute top-0 left-0 w-8 sm:w-12 h-8 sm:h-12 bg-[#1ABA7F]/20 rounded-br-full" />
          <DialogHeader className="flex flex-col items-center gap-2 sm:gap-3">
            <CheckCircle
              className="h-10 w-10 sm:h-12 sm:w-12 text-[#1ABA7F] animate-[pulse_1s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            <DialogTitle className="text-lg sm:text-2xl font-bold text-[#225F91] text-center tracking-tight">
              {t('upload.success_title')}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 sm:mt-4 text-sm sm:text-base font-medium text-center text-gray-600">
            {t('upload.success_message')} {' '}
            <span className="font-semibold text-gray-900" aria-label={t('upload.contact_label')}>
              {submittedContact}
            </span>{' '}
            {t('upload.success_message_end')}
          </p>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base font-medium text-center text-gray-600">
            {t('upload.verification_info')} {' '}
            <Link
              href="/status-check"
              className="font-semibold text-[#225F91] hover:text-[#1A4971] underline transition-colors duration-200"
              aria-label={t('upload.check_status')}
            >
              {t('upload.check_status')}
            </Link>
            .
          </p>
          <DialogFooter className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={handleUploadAnother}
              className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
              aria-label={t('upload.upload_another')}
            >
              {t('upload.upload_another')}
            </Button>
            <Button
              asChild
              className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300"
              aria-label={t('upload.track_order')}
            >
              <Link href="/track">{t('upload.track_order')}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 sm:space-y-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-6"
          role="form"
          aria-labelledby="form-title"
        >
       
          {/* File Upload */}
          <div>
            <Label
              htmlFor="fileInput"
              className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider"
            >
              {t('upload.file_label')}
            </Label>
            
            {/* File Preview */}
            {file && (
              <div className="mt-2 sm:mt-3 p-3 sm:p-4 border border-[#1ABA7F]/20 rounded-lg sm:rounded-xl bg-[#1ABA7F]/5 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {getFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {filePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilePreview(!showFilePreview)}
                        className="h-7 sm:h-8 w-7 sm:w-8 p-0 text-[#225F91] hover:bg-[#225F91]/10"
                        aria-label="Preview file"
                      >
                        <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-7 sm:h-8 w-7 sm:w-8 p-0 text-red-500 hover:bg-red-100"
                      aria-label="Remove file"
                    >
                      <X className="h-3 sm:h-4 w-3 sm:w-4" />
                    </Button>
                  </div>
                </div>
                
                {showFilePreview && filePreview && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 border border-[#1ABA7F]/20 rounded-lg bg-white">
                    <img 
                      src={filePreview} 
                      alt="File preview" 
                      className="w-full h-auto max-h-40 sm:max-h-48 object-contain rounded"
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
                  "mt-2 sm:mt-3 p-6 sm:p-8 border-2 border-dashed rounded-lg sm:rounded-xl text-center bg-white/95 transition-all duration-300",
                  isDragOver
                    ? "border-[#1ABA7F] bg-[#1ABA7F]/5 shadow-[0_0_20px_rgba(26,186,127,0.3)]"
                    : "border-[#1ABA7F]/20 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_15px_rgba(26,186,127,0.2)]"
                )}
                role="region"
                aria-label={t('upload.drag_drop_label')}
              >
                <Input
                  id="fileInput"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "p-3 sm:p-4 rounded-full transition-all duration-300",
                    isDragOver ? "bg-[#1ABA7F]/20" : "bg-[#1ABA7F]/10"
                  )}>
                    <Upload className={cn(
                      "h-6 sm:h-8 w-6 sm:w-8 transition-colors duration-300",
                      isDragOver ? "text-[#1ABA7F]" : "text-[#225F91]/70"
                    )} aria-hidden="true" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-base sm:text-lg font-medium text-gray-900">
                      {isDragOver ? "Drop your file here" : "Drag & drop your prescription"}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600">
                      or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-[#225F91] hover:text-[#1A4971] font-semibold underline transition-colors duration-200"
                      >
                        browse files
                      </button>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <Badge variant="outline" className="border-[#1ABA7F]/20 text-[#225F91]">
                      PDF, JPG, PNG
                    </Badge>
                    <Badge variant="outline" className="border-[#1ABA7F]/20 text-[#225F91]">
                      Max 10MB
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            {errors.file && (
              <p id="file-error" className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 sm:h-4 w-3 sm:w-4" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-[#225F91] font-medium">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5 sm:h-2" />
            </div>
          )}

             {/* Contact Information */}
          <div>
            <Label
              htmlFor="contact"
              className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider"
            >
              {t('upload.contact_label')}
            </Label>
            <div className="relative mt-1 sm:mt-2">
              <Mail
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-[#225F91]/70"
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
                placeholder={t('upload.contact_placeholder')}
                className={cn(
                  "h-10 sm:h-12 pl-10 sm:pl-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl border bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300",
                  errors.contact 
                    ? "border-red-300 focus:border-red-500" 
                    : "border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50"
                )}
                aria-invalid={!!errors.contact}
                aria-describedby={errors.contact ? 'contact-error' : undefined}
              />
            </div>
            {errors.contact && (
              <p id="contact-error" className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 sm:h-4 w-3 sm:w-4" />
                {errors.contact}
              </p>
            )}
          </div>


          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isUploading || !file || !contact}
            className="w-full h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <svg
                  className="animate-spin h-5 sm:h-6 w-5 sm:w-6"
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
                {t('upload.uploading')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <Upload className="h-5 sm:h-6 w-5 sm:w-6" aria-hidden="true" />
                {t('upload.upload_button')}
              </span>
            )}
          </Button>

          {/* Info Section */}
          <div className="p-3 sm:p-4 bg-[#1ABA7F]/5 rounded-lg sm:rounded-xl border border-[#1ABA7F]/20">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="h-4 sm:h-5 w-4 sm:w-5 text-[#225F91] mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p className="text-sm sm:text-base font-medium text-gray-700">Upload Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-sm sm:text-base">
                  <li>Ensure your prescription is clearly visible and readable</li>
                  <li>Supported formats: PDF, JPG, PNG (max 10MB)</li>
                  <li>We'll process your prescription within 24 hours</li>
                  <li>You'll receive updates via your provided contact</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}