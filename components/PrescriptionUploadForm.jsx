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
import { Upload, CheckCircle, FileText, Mail, X, Eye, Camera, AlertCircle, Info, Sparkles, Shield } from 'lucide-react';
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
  const [contactFocused, setContactFocused] = useState(false);
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
    if (type.startsWith('image/')) return <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-[#1ABA7F]" />;
    return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#225F91]" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    if (!validateForm()) {
      toast.error(t('upload.errors.fix_errors'));
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
          toast.error(errorData.message || t('upload.errors.upload_failed'));
        }
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast.error(t('upload.errors.upload_failed'));
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/upload`);
      xhr.setRequestHeader('x-guest-id', userIdentifier);
      xhr.send(formData);
    } catch (err) {
      toast.error(err.message || t('upload.errors.upload_failed'));
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
        <DialogContent className="sm:max-w-md p-0 border-0 rounded-3xl bg-white overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/20 to-transparent rounded-br-full" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#225F91]/20 to-transparent rounded-tl-full" />
          
          <div className="relative z-10 p-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#1ABA7F] to-[#16a876] flex items-center justify-center shadow-xl">
                  <CheckCircle className="w-10 h-10 text-white animate-in zoom-in-50 duration-500" />
                </div>
              </div>
            </div>

            <DialogHeader className="flex flex-col items-center gap-3 mb-6">
              <DialogTitle className="text-2xl sm:text-3xl font-black text-[#225F91] tracking-tight text-center">
                {t('upload.success_title')}
              </DialogTitle>
            </DialogHeader>

            <div className="text-center mb-8 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
              <p className="text-base text-gray-600">
                {t('upload.success_message')}{' '}
                <span className="font-bold text-[#225F91] text-lg block mt-1">{submittedContact}</span>
                <span className="text-sm block mt-2">{t('upload.success_message_end')}</span>
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="group flex-1 h-12 px-6 text-sm font-bold rounded-xl bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
              >
                <Link href="/check-prescription-status">
                  <span className="relative z-10">Check Status</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleUploadAnother}
                className="group flex-1 h-12 px-6 text-sm font-bold rounded-xl border-2 border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 transition-all duration-300 hover:scale-105"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fileInput" className="text-sm font-black text-[#225F91] uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#1ABA7F]" />
                {t('upload.file_label')}
              </Label>
              {file && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-2 py-1 text-xs font-bold shadow-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
            
            {file && (
              <div className="p-4 border-2 border-[#1ABA7F]/30 rounded-2xl bg-gradient-to-br from-[#1ABA7F]/5 to-white animate-in slide-in-from-top-2 duration-300 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-white shadow-sm">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
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
                        className="h-8 w-8 p-0 rounded-lg text-[#225F91] hover:bg-[#225F91]/10 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {showFilePreview && filePreview && (
                  <div className="mt-3 p-3 border-2 border-[#1ABA7F]/20 rounded-xl bg-white shadow-inner">
                    <img 
                      src={filePreview} 
                      alt="File preview" 
                      className="w-full h-auto max-h-48 object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {!file && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative p-6 sm:p-10 border-2 border-dashed rounded-2xl text-center transition-all duration-300 overflow-hidden",
                  isDragOver
                    ? "border-[#1ABA7F] bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/5 shadow-[0_0_30px_rgba(26,186,127,0.3)] scale-[1.02]"
                    : "border-[#1ABA7F]/30 bg-gradient-to-br from-white to-gray-50 hover:border-[#1ABA7F]/60 hover:shadow-xl"
                )}
              >
                {isDragOver && (
                  <div className="absolute inset-0 pointer-events-none">
                    <Sparkles className="absolute top-4 right-4 h-6 w-6 text-[#1ABA7F] animate-pulse" />
                    <Sparkles className="absolute bottom-4 left-4 h-4 w-4 text-[#225F91] animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <Sparkles className="absolute top-1/2 left-1/4 h-5 w-5 text-[#76D1F3] animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
                
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
                    "relative p-4 rounded-2xl transition-all duration-300",
                    isDragOver ? "bg-[#1ABA7F]/20 scale-110" : "bg-[#1ABA7F]/10"
                  )}>
                    <div className={cn(
                      "absolute inset-0 rounded-2xl blur-xl opacity-0 transition-opacity duration-300",
                      isDragOver && "opacity-50 bg-gradient-to-r from-[#1ABA7F] to-[#225F91]"
                    )} />
                    <Upload className={cn(
                      "relative h-8 w-8 transition-all duration-300",
                      isDragOver ? "text-[#1ABA7F] animate-bounce" : "text-[#225F91]"
                    )} />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      {isDragOver ? "Drop your prescription here!" : "Drag & drop your prescription"}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600">
                      or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-[#225F91] hover:text-[#1ABA7F] font-bold underline underline-offset-2 transition-colors duration-200"
                      >
                        browse files
                      </button>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
                    <Badge className="bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 text-[#225F91] border border-[#1ABA7F]/30 px-3 py-1 font-semibold">
                      PDF, JPG, PNG
                    </Badge>
                    <Badge className="bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 text-[#225F91] border border-[#1ABA7F]/30 px-3 py-1 font-semibold">
                      Max 10MB
                    </Badge>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 max-w-md">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900 text-left font-medium">
                      Ensure your prescription is clearly visible and readable
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {errors.file && (
              <p className="text-sm text-red-600 font-semibold flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.file}
              </p>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-r from-[#1ABA7F]/5 to-[#225F91]/5 border-2 border-[#1ABA7F]/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-semibold flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1ABA7F] border-t-transparent"></div>
                  Uploading your prescription...
                </span>
                <span className="text-[#225F91] font-black text-lg">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-gray-200" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="contact" className="text-sm font-black text-[#225F91] uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#1ABA7F]" />
                {t('upload.contact_label')}
              </Label>
              {contact && validateContact(contact) && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-2 py-1 text-xs font-bold shadow-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              )}
            </div>
            
            <div className="relative group">
              <div className={cn(
                "absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F] opacity-0 transition-opacity duration-500 blur-sm",
                contactFocused && "opacity-20"
              )} />
              
              <div className="relative">
                <Mail
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300",
                    contactFocused ? "text-[#1ABA7F] scale-110" : "text-[#225F91]/70"
                  )}
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
                  placeholder={t('upload.contact_placeholder')}
                  className={cn(
                    "h-14 pl-12 pr-4 text-base font-medium rounded-2xl border-2 bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-300 shadow-lg",
                    errors.contact
                      ? "border-red-300 focus:border-red-500"
                      : contactFocused
                      ? "border-[#1ABA7F] shadow-[0_0_20px_rgba(26,186,127,0.2)]"
                      : "border-gray-200 hover:border-[#1ABA7F]/50"
                  )}
                />
              </div>
            </div>
            
            {errors.contact && (
              <p className="text-sm text-red-600 font-semibold flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.contact}
              </p>
            )}
          </div>

          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isUploading || !file || !contact}
            className="group relative w-full h-14 px-6 text-base font-black rounded-2xl bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  {t('upload.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  {t('upload.upload_button')}
                </>
              )}
            </span>
            {!isUploading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}