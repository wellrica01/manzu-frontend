'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Loader2
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
  const fileInputRef = useRef(null);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach((file, index) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`, { duration: 4000 });
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        toast.error(`${file.name} is not a valid file type`, { duration: 4000 });
        return;
      }
      formData.append('prescriptions', file);
    });

    formData.append('patientIdentifier', guestId);
    formData.append('medicationIds', items.map(item => item.pharmacyMedicationMedicationId).join(','));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescription/upload`, {
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
        ...Object.fromEntries(Array.from(files).map(file => [file.name, 'uploaded']))
      }));

      toast.success('Prescriptions uploaded successfully', { duration: 4000 });
      onUploadSuccess?.();
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
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const getItemStatus = (item) => {
    const status = prescriptionStatuses[item.pharmacyMedicationMedicationId] || 'none';
    return status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">Pending</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Required</Badge>;
    }
  };

  return (
    <Card className="bg-orange-50/80 border border-orange-200 rounded-lg shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-orange-800 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Prescriptions
        </CardTitle>
        <p className="text-sm text-orange-700">
          Upload prescriptions for the medications below
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items List - Simplified */}
        <div className="space-y-2">
          {items.map((item) => {
            const status = getItemStatus(item);
            return (
              <div key={item.id} className="flex items-center justify-between p-2 bg-white/80 rounded border border-orange-200">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{item.medication.displayName}</h4>
                    <p className="text-xs text-gray-600">{item.medication.genericName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                  <span className="text-sm font-medium text-gray-900">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Section */}
        <div className="space-y-3">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300",
              dragActive 
                ? "border-orange-400 bg-orange-50" 
                : "border-orange-300 bg-white/80 hover:border-orange-400 hover:bg-orange-50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Upload Prescriptions
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mb-3">
              PDF, JPG, PNG (max 5MB each)
            </p>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-1" />
                  Choose Files
                </>
              )}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded Files Status */}
          {Object.keys(uploadedFiles).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-gray-900">Uploaded Files:</h4>
              {Object.entries(uploadedFiles).map(([filename, status]) => (
                <div key={filename} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                  <span className="text-xs text-green-800">{filename}</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    {status === 'uploaded' ? 'Uploaded' : 'Processing'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Prescription Review</p>
              <p>Your prescriptions will be reviewed within 24-48 hours. You'll be notified once verified.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionUploadSection; 