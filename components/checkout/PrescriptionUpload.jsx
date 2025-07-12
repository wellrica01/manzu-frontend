import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, File as FileIcon, Eye, X, CheckCircle, AlertCircle, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';

const PrescriptionUpload = ({ handleFileChange, fileInputRef, prescriptionFile }) => {
  const [previewUrl, setPreviewUrl] = useState(prescriptionFile ? URL.createObjectURL(prescriptionFile) : null);
  const [dragActive, setDragActive] = useState(false);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit', { duration: 4000 });
        return;
      }
      if (['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setPreviewUrl(file.type === 'application/pdf' ? null : URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      handleFileChange(e);
    }
  };

  const clearFile = () => {
    setPreviewUrl(null);
    fileInputRef.current.value = '';
    handleFileChange({ target: { files: [] } });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit', { duration: 4000 });
        return;
      }
      if (['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setPreviewUrl(file.type === 'application/pdf' ? null : URL.createObjectURL(file));
        const event = { target: { files: [file] } };
        handleFileChange(event);
      } else {
        toast.error('Please upload a valid PDF, JPG, or PNG file', { duration: 4000 });
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return FileText;
    return Image;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <Label htmlFor="prescription" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
        Prescription File
      </Label>
      
      <div
        className={`mt-3 p-6 border-2 border-dashed rounded-xl text-center transition-all duration-300 ${
          prescriptionFile
            ? 'border-[#1ABA7F] bg-[#1ABA7F]/10 hover:border-[#16A068]'
            : dragActive
            ? 'border-[#1ABA7F] bg-[#1ABA7F]/20'
            : 'border-[#1ABA7F]/20 bg-white/95 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_10px_rgba(26,186,127,0.2)]'
        }`}
        role="region"
        aria-label={prescriptionFile ? 'Prescription file uploaded' : 'Drag and drop prescription file here'}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          id="prescription"
          name="prescription"
          type="file"
          accept=".pdf,image/jpeg,image/png"
          onChange={onFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        
        <div className="flex flex-col items-center gap-3">
          {prescriptionFile ? (
            <>
              <div className="flex items-center gap-2 text-[#1ABA7F] text-base font-medium animate-in fade-in-20 duration-300">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                File uploaded successfully
              </div>
              
              <div className="w-full max-w-md">
                <div className="p-4 bg-white/80 rounded-xl border border-[#1ABA7F]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1ABA7F]/20 rounded-full flex items-center justify-center">
                      {(() => {
                        const FileIcon = getFileIcon(prescriptionFile.type);
                        return <FileIcon className="h-5 w-5 text-[#1ABA7F]" />;
                      })()}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {prescriptionFile.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(prescriptionFile.size)} • {prescriptionFile.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {previewUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-[#225F91] hover:text-[#1A4971] hover:bg-[#1ABA7F]/10"
                  >
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Preview prescription file"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFile}
                  className="text-gray-600 hover:text-gray-900 hover:bg-[#1ABA7F]/10"
                  aria-label="Change prescription file"
                >
                  <X className="h-4 w-4 mr-1" />
                  Change File
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#1ABA7F]/20 rounded-full flex items-center justify-center mb-2">
                <Upload
                  className="h-8 w-8 text-[#225F91] transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-base text-gray-600 font-medium">
                  Drag your prescription here or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-[#225F91] hover:text-[#1A4971] font-semibold underline transition-colors duration-300"
                    aria-label="Browse for prescription file"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">Supports .pdf, .jpg, .jpeg, .png (max 5MB)</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Requirements */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-800">File Requirements</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>Clear, readable prescription image or PDF</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>Maximum file size: 5MB</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>Supported formats: PDF, JPG, PNG</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>Prescription must be valid and not expired</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;