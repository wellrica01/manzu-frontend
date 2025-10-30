'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Loader2,
  Eye,
  X,
  Shield,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConsentCheck } from '@/hooks/useConsentCheck';
import ConsentModal from '@/components/ConsentModal';


const PrescriptionUploadSection = ({ 
  items, 
  guestId, 
  onUploadSuccess,
  prescriptionStatuses = {} 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileInfo, setUploadFileInfo] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(true);
  const [contactPhone, setContactPhone] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Check if any items need prescriptions
  const needsPrescription = items.some(item => 
    prescriptionStatuses[item.medication.id] === 'NONE' ||
    prescriptionStatuses[item.medication.id] === 'REJECTED' ||
    prescriptionStatuses[item.medication.id] === 'EXPIRED'
  );

  const validateContact = () => {
    const newErrors = {};
    
    if (!contactPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(contactPhone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Please upload a file smaller than 5MB.', {
        duration: 5000,
      });
      return;
    }
    
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Unsupported file type. Please upload a PDF, JPG, or PNG file.', {
        duration: 5000,
      });
      return;
    }

    setSelectedFile(file);
    createFilePreview(file);
    setErrors(prev => ({ ...prev, file: null }));
  };

  const { isConsentOpen, checkConsent, handleConsentClose } = useConsentCheck();

  const handleFileUpload = async () => {
  if (!selectedFile) {
    toast.error('Please select a file first');
    return;
  }

  if (!validateContact()) {
    toast.error('Please fix contact information errors');  
    return;
  }

  
    // Check consent before uploading
    if (!checkConsent()) {
      toast.error('Please accept our privacy policy before uploading prescriptions');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    formData.append('prescriptionFile', selectedFile);
    formData.append('userIdentifier', guestId);
    
    const medicationsNeedingPrescription = items.filter(item => 
      prescriptionStatuses[item.medication.id] === 'NONE' ||
      prescriptionStatuses[item.medication.id] === 'REJECTED' ||
      prescriptionStatuses[item.medication.id] === 'EXPIRED'
    );
    
    formData.append('medicationIds', medicationsNeedingPrescription.map(item => item.medication.id).join(','));
    formData.append('phone', contactPhone);

    try {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const responseData = JSON.parse(xhr.responseText);
          
          setUploadedFiles(prev => ({
            ...prev,
            [selectedFile.name]: 'uploaded'
          }));

          // Store file info for display
          setUploadFileInfo(responseData.fileInfo);

          // Show success dialog
          setShowSuccessDialog(true);
          onUploadSuccess?.();
          setShowUploadArea(false);
          setSelectedFile(null);
          setFilePreview(null);
          setContactPhone('');
        } else {
          // Parse error response
          let errorMessage = 'Upload failed. Please try again.';
          
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          
          // Show error with longer duration for user to read
          toast.error(errorMessage, {
            duration: 6000,
            description: xhr.status === 400 
              ? 'Please check your file and try again.' 
              : 'If this continues, please contact support.'
          });
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast.error('Network error occurred while uploading.', {
          duration: 5000,
          description: 'Please check your internet connection and try again.'
        });
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/cart/prescription/upload`);
      xhr.setRequestHeader('x-guest-id', guestId);
      xhr.send(formData);
    } catch (error) {
      toast.error(error.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setShowFilePreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getItemStatus = (item) => {
    return prescriptionStatuses[item.medication.id] || 'NONE';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-600" strokeWidth={2} />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-orange-600" strokeWidth={2} />;
      case 'REJECTED':
        return <X className="h-5 w-5 text-red-600" strokeWidth={2} />;
      case 'EXPIRED': 
        return <AlertCircle className="h-5 w-5 text-purple-600" strokeWidth={2} />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" strokeWidth={2} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-600 text-white border-0 px-3 py-1 text-xs font-bold">Verified</Badge>;
      case 'PENDING':
        return <Badge className="bg-orange-600 text-white border-0 px-3 py-1 text-xs font-bold">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-600 text-white border-0 px-3 py-1 text-xs font-bold">Rejected</Badge>;
      case 'EXPIRED': 
        return <Badge className="bg-purple-600 text-white border-0 px-3 py-1 text-xs font-bold">Expired</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white border-0 px-3 py-1 text-xs font-bold">Required</Badge>;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'Ready for checkout';
      case 'PENDING':
        return 'Under review by pharmacy team';
      case 'REJECTED':
        return 'Please upload a new prescription';
      case 'EXPIRED': 
        return 'Prescription expired - please upload a new one';
      default:
        return 'Prescription upload required';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'border-green-200 bg-green-50';
      case 'PENDING':
        return 'border-orange-200 bg-orange-50';
      case 'REJECTED':
        return 'border-red-200 bg-red-50';
      case 'EXPIRED': 
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-3xl shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-gray-50 to-white p-6 border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-[#225F91] flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#1ABA7F] to-[#16a876] rounded-lg shadow-md">
            <FileText className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          Prescription Upload
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Items Status List */}
        <div className="space-y-3">
          {items.map((item) => {
            const status = getItemStatus(item);
            return (
              <div key={item.id} className={cn(
                "p-4 rounded-2xl border transition-all duration-200",
                getStatusColor(status)
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      {getStatusIcon(status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 mb-1">
                        {item.medication.displayName}
                      </h4>
                      <p className="text-sm text-gray-600">{getStatusMessage(status)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(status)}
                    <span className="text-lg font-black text-[#225F91]">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Section - Only show if needed */}
        {needsPrescription && showUploadArea && (
          <div className="space-y-6">
            {/* Context-Aware Header */}
            <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-gray-900 mb-2">
                    {items.some(item => getItemStatus(item) === 'REJECTED') 
                      ? 'Re-upload Your Prescription'
                      : items.some(item => getItemStatus(item) === 'EXPIRED')
                      ? 'Upload Fresh Prescription'
                      : 'Upload Prescription to Continue'}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {items.some(item => getItemStatus(item) === 'REJECTED') 
                      ? 'Please upload a clearer image of your prescription. Make sure all text is readable and the document is well-lit.'
                      : items.some(item => getItemStatus(item) === 'EXPIRED')
                      ? 'Your prescription verification has expired. You can upload the same prescription again for quick re-verification.'
                      : 'Upload your prescription to proceed with checkout. Our pharmacy team will verify it within 15-30 minutes.'}
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300",
                dragActive 
                  ? "border-[#1ABA7F] bg-[#1ABA7F]/5 scale-[1.01]" 
                  : "border-gray-300 bg-gray-50 hover:border-[#1ABA7F]/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!selectedFile ? (
                <>
                  <div className={cn(
                    "p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center transition-all duration-300",
                    dragActive ? "bg-[#1ABA7F]/20" : "bg-gray-200"
                  )}>
                    <Upload className={cn(
                      "h-8 w-8",
                      dragActive ? "text-[#1ABA7F]" : "text-gray-600"
                    )} strokeWidth={2} />
                  </div>

                  <p className="text-base text-gray-700 font-medium mb-6">
                    Drag and drop your prescription, or click to browse
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" strokeWidth={2} />
                      <span>PDF, JPG, PNG files accepted</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" strokeWidth={2} />
                      <span>Maximum 5MB per file</span>
                    </div>
                    {items.some(item => getItemStatus(item) === 'REJECTED') && (
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" strokeWidth={2} />
                        <span className="font-semibold text-orange-700">Ensure image is clear and well-lit</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 px-8 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-bold rounded-lg shadow-lg"
                  >
                    <Upload className="h-5 w-5 mr-2" strokeWidth={2} />
                    Choose File
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" strokeWidth={2} />
                      <span className="text-sm font-semibold text-green-900">
                        {selectedFile.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 rounded-lg"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </Button>
                  </div>
                  
                  {filePreview && (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilePreview(!showFilePreview)}
                        className="border-2 border-gray-200 hover:bg-gray-50 rounded-lg font-semibold"
                      >
                        <Eye className="h-4 w-4 mr-2" strokeWidth={2} />
                        {showFilePreview ? 'Hide Preview' : 'Show Preview'}
                      </Button>
                      {showFilePreview && (
                        <div className="max-w-sm mx-auto">
                          <img 
                            src={filePreview} 
                            alt="Prescription preview" 
                            className="rounded-lg border-2 border-gray-200 shadow-md" 
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contact Information Form */}
            {selectedFile && (
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-blue-600" strokeWidth={2} />
                    <h4 className="text-base font-bold text-gray-900">Contact Information</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We'll notify you via SMS when your prescription is verified
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-bold text-gray-900">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 801 234 5678"
                      value={contactPhone}
                      onChange={(e) => {
                        setContactPhone(e.target.value);
                        setErrors(prev => ({ ...prev, phone: null }));
                      }}
                      className={cn(
                        "h-12",
                        errors.phone ? 'border-red-300' : ''
                      )}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploading}
                    className="w-full h-12 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-bold rounded-lg shadow-lg disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" strokeWidth={2} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" strokeWidth={2} />
                        Upload Prescription
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {/* Upload Progress */}
            {uploading && uploadProgress > 0 && (
              <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-[#1ABA7F]/5 to-white border border-[#1ABA7F]/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-semibold flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#1ABA7F]" strokeWidth={2} />
                    Uploading prescription...
                  </span>
                  <span className="text-[#225F91] font-bold">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {errors.file && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-sm font-semibold text-red-800">File Error</p>
                  <p className="text-sm text-red-700">{errors.file}</p>
                </div>
              </div>
            )}

            {/* Uploaded Files Status */}
            {Object.keys(uploadedFiles).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" strokeWidth={2} />
                  Uploaded Files
                </h4>
                {Object.entries(uploadedFiles).map(([filename, status]) => (
                  <div key={filename} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-green-900">{filename}</span>
                    <Badge className="bg-green-600 text-white">
                      {status === 'uploaded' ? 'Uploaded' : 'Processing'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Success Message */}
        {!showUploadArea && (
          <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" strokeWidth={2} />
              <div>
                <h4 className="text-lg font-bold text-green-900 mb-2">Upload Successful!</h4>
                <p className="text-base text-green-800 leading-relaxed">
                  Your prescription is being reviewed by our pharmacy team.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Process Information */}
        <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-3">
                {items.some(item => getItemStatus(item) === 'REJECTED')
                  ? 'Re-Verification Process'
                  : items.some(item => getItemStatus(item) === 'EXPIRED')
                  ? 'Quick Re-Verification'
                  : 'Verification Process'}
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span>
                    {items.some(item => getItemStatus(item) === 'REJECTED')
                      ? 'Licensed pharmacists will carefully review your updated prescription'
                      : items.some(item => getItemStatus(item) === 'EXPIRED')
                      ? 'Same prescription can be re-uploaded - no new doctor visit needed'
                      : 'Licensed pharmacists review each prescription'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span>
                    {items.some(item => ['REJECTED', 'EXPIRED'].includes(getItemStatus(item)))
                      ? 'Re-verification typically takes 15-30 minutes during business hours'
                      : 'Verification typically takes 24-48 hours'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span>You'll receive notification when verified</span>
                </div>
                {items.some(item => getItemStatus(item) === 'EXPIRED') && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <span className="font-semibold text-purple-700">
                      Prescriptions are valid for 48 hours after verification
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md rounded-3xl">
          <div className="bg-gradient-to-br from-[#1ABA7F] to-[#16a876] p-8 -m-6 mb-0 rounded-t-3xl text-white">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                <CheckCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-1">Upload Successful!</h3>
                <p className="text-white/90 text-sm">Your prescription is being reviewed</p>
              </div>
            </div>
          </div>

          {uploadFileInfo && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-2 font-semibold">File Processing Stats</p>
              <div className="space-y-1 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Original Size:</span>
                  <span className="font-medium">{(uploadFileInfo.originalSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimized Size:</span>
                  <span className="font-medium">{(uploadFileInfo.processedSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span>Size Reduction:</span>
                  <span className="font-bold text-green-600">{uploadFileInfo.compressionRatio}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-700 text-center">
              Our pharmacy team will verify your prescription within 15-30 minutes during business hours.
            </p>
            
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full h-12 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-lg"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PrescriptionUploadSection;