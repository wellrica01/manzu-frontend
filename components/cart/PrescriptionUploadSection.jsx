'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Check if any items need prescriptions
  const needsPrescription = items.some(item => 
    prescriptionStatuses[item.medication.id] === 'NONE' ||
    prescriptionStatuses[item.medication.id] === 'REJECTED'
  );

  const validateContact = () => {
    const newErrors = {};
    
    if (!contactEmail && !contactPhone) {
      newErrors.contact = 'Please provide either email or phone number';
    }
    
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (contactPhone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(contactPhone)) {
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
      alert('File exceeds 5MB limit');
      return;
    }
    
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      alert('Invalid file type. Please upload PDF, JPG, or PNG');
      return;
    }

    setSelectedFile(file);
    createFilePreview(file);
    setErrors(prev => ({ ...prev, file: null }));
  };

  const { isConsentOpen, checkConsent, handleConsentClose } = useConsentCheck();

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (!validateContact()) {
      alert('Please fix contact information errors');
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
      prescriptionStatuses[item.medication.id] === 'REJECTED'
    );
    
    formData.append('medicationIds', medicationsNeedingPrescription.map(item => item.medication.id).join(','));
    formData.append('email', contactEmail);
    formData.append('phone', contactPhone);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/prescription/upload`, {
        method: 'POST',
        headers: { 'x-guest-id': guestId },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      setUploadedFiles(prev => ({
        ...prev,
        [selectedFile.name]: 'uploaded'
      }));

      alert('Prescription uploaded successfully!');
      onUploadSuccess?.();
      setShowUploadArea(false);
      setSelectedFile(null);
      setFilePreview(null);
      setContactEmail('');
      setContactPhone('');
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
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
                    <Mail className="h-5 w-5 text-blue-600" strokeWidth={2} />
                    <h4 className="text-base font-bold text-gray-900">Contact Information</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We'll notify you when your prescription is verified
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-bold text-gray-900">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className={cn(
                          "h-12",
                          errors.email ? 'border-red-300' : ''
                        )}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-bold text-gray-900">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 801 234 5678"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className={cn(
                          "h-12",
                          errors.phone ? 'border-red-300' : ''
                        )}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  {errors.contact && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-sm text-red-700">{errors.contact}</p>
                    </div>
                  )}
                  
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
              <h4 className="text-base font-bold text-gray-900 mb-3">Verification Process</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span>Licensed pharmacists review each prescription</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span>Verification typically takes 24-48 hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span>You'll receive notification when verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
    </Card>
  );
};

export default PrescriptionUploadSection;