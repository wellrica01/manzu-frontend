'use client';

import { useState, useRef, useEffect } from 'react';
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
  Info,
  Shield,
  Mail,
  Phone,
  User,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Check if any items need prescriptions
  const needsPrescription = items.some(item => 
    prescriptionStatuses[item.pharmacyMedicationMedicationId] === 'none' ||
    prescriptionStatuses[item.pharmacyMedicationMedicationId] === 'rejected'
  );

  const validateContact = () => {
    const newErrors = {};
    
    // At least one contact method is required
    if (!contactEmail && !contactPhone) {
      newErrors.contact = 'Please provide either email or phone number for notifications';
    }
    
    // Validate email if provided
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate phone if provided
    if (contactPhone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(contactPhone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // File size validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} exceeds 5MB limit`, { duration: 4000 });
      return;
    }
    
    // File type validation
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast.error(`${file.name} is not a valid file type. Please upload PDF, JPG, or PNG files.`, { duration: 4000 });
      return;
    }

    setSelectedFile(file);
    createFilePreview(file);
    setErrors(prev => ({ ...prev, file: null }));
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first', { duration: 4000 });
      return;
    }

    if (!validateContact()) {
      toast.error('Please fix the contact information errors', { duration: 4000 });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    formData.append('prescriptionFile', selectedFile);
    formData.append('userIdentifier', guestId);
    // Only send medication IDs that actually need prescription (status 'none' or 'rejected')
    const medicationsNeedingPrescription = items.filter(item => 
      prescriptionStatuses[item.pharmacyMedicationMedicationId] === 'none' ||
      prescriptionStatuses[item.pharmacyMedicationMedicationId] === 'rejected'
    );
    
    formData.append('medicationIds', medicationsNeedingPrescription.map(item => item.pharmacyMedicationMedicationId).join(','));
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

      const result = await response.json();
      setUploadedFiles(prev => ({
        ...prev,
        [selectedFile.name]: 'uploaded'
      }));

      toast.success('Prescription uploaded successfully! Our team will review it within 24-48 hours.', { duration: 5000 });
      onUploadSuccess?.();
      setShowUploadArea(false);
      setSelectedFile(null);
      setFilePreview(null);
      setContactEmail('');
      setContactPhone('');
      setShowContactForm(false);
    } catch (error) {
      toast.error(error.message, { duration: 4000 });
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
    const status = prescriptionStatuses[item.pharmacyMedicationMedicationId] || 'none';
    return status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium">✓ Verified</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs font-medium">⏳ Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-medium">✗ Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs font-medium">📋 Required</Badge>;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'verified':
        return 'This medication is ready for checkout';
      case 'pending':
        return 'Under review by our pharmacy team';
      case 'rejected':
        return 'Please upload a new prescription';
      default:
        return 'Prescription upload required';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'border-green-200 bg-green-50/80';
      case 'pending':
        return 'border-orange-200 bg-orange-50/80';
      case 'rejected':
        return 'border-red-200 bg-red-50/80';
      default:
        return 'border-gray-200 bg-gray-50/80';
    }
  };

  return (
    <Card className="relative bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-gradient-to-r from-[#1ABA7F]/10 to-transparent pb-6">
        <CardTitle className="text-xl font-bold text-[#225F91] flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl shadow-sm">
            <FileText className="h-5 w-5 text-[#225F91]" />
          </div>
          Prescription Status
        </CardTitle>
        <p className="text-sm text-gray-600 leading-relaxed">
          Track your prescription uploads and verification status
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enhanced Items Status List */}
        <div className="space-y-4">
          {items.map((item) => {
            const status = getItemStatus(item);
            return (
              <div key={item.id} className={cn(
                "p-6 rounded-2xl border transition-all duration-200 shadow-sm",
                getStatusColor(status)
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getStatusIcon(status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-[#225F91] mb-2">{item.medication.displayName}</h4>
                      <p className="text-sm text-gray-700 mb-2">{item.medication.genericName}</p>
                      <p className="text-sm text-gray-600 font-medium">{getStatusMessage(status)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(status)}
                    <span className="text-lg font-bold text-[#225F91]">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Upload Section - Only show if needed */}
        {needsPrescription && showUploadArea && (
          <div className="space-y-6">
            {/* Enhanced File Upload Area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300",
                dragActive 
                  ? "border-orange-400 bg-orange-50" 
                  : "border-orange-300 bg-white/80 hover:border-orange-400 hover:bg-orange-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!selectedFile ? (
                <>
                  <Upload className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Upload Prescription
                  </h3>
                  <p className="text-base text-gray-600 mb-6 leading-relaxed">
                    Drag and drop files here, or click to browse
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>PDF, JPG, PNG files accepted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Maximum 5MB per file</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Clear, readable images preferred</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-14 text-lg font-semibold rounded-xl bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.4)] transition-all duration-300"
                  >
                    <Upload className="h-5 w-5 mr-3" />
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-base font-semibold text-green-800">{selectedFile.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {filePreview && (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilePreview(!showFilePreview)}
                        className="text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showFilePreview ? 'Hide Preview' : 'Show Preview'}
                      </Button>
                      {showFilePreview && (
                        <div className="max-w-sm mx-auto">
                          <img src={filePreview} alt="File preview" className="rounded-2xl border shadow-sm" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Contact Information Form */}
            {selectedFile && (
              <div className="p-6 bg-[#1ABA7F]/10 rounded-2xl border border-[#1ABA7F]/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#1ABA7F]" />
                    <h4 className="text-lg font-bold text-[#225F91]">Contact Information</h4>
                  </div>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Please provide your contact information so we can notify you when your prescription is verified.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className={cn(
                          "h-12 text-base",
                          errors.email ? 'border-red-300 focus:border-red-500' : ''
                        )}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 801 234 5678"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className={cn(
                          "h-12 text-base",
                          errors.phone ? 'border-red-300 focus:border-red-500' : ''
                        )}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  {errors.contact && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <p className="text-sm text-red-700 font-medium">{errors.contact}</p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploading}
                    className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-3" />
                        Upload Prescription
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Enhanced Uploaded Files Status */}
            {Object.keys(uploadedFiles).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-900">Uploaded Files:</h4>
                {Object.entries(uploadedFiles).map(([filename, status]) => (
                  <div key={filename} className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-200">
                    <span className="text-base font-medium text-green-800">{filename}</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-sm font-medium">
                      {status === 'uploaded' ? '✓ Uploaded' : 'Processing'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Upload Success Message */}
        {!showUploadArea && (
          <div className="p-6 bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl border border-green-200">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-bold text-green-800 mb-2">Upload Successful!</h4>
                <p className="text-base text-green-700 leading-relaxed">
                  Your prescription has been uploaded and is being reviewed by our pharmacy team.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Process Information */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-blue-800 mb-4">Verification Process</h4>
              <div className="space-y-3 text-base text-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Our licensed pharmacists review each prescription</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Verification typically takes 24-48 hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>You'll be notified via email/SMS when verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Contact Support */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 text-base text-gray-600">
            <Mail className="h-5 w-5" />
            <span className="font-medium">Need help? Contact our pharmacy team for assistance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionUploadSection; 