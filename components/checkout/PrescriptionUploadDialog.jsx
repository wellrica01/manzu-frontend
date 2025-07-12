import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Image, AlertCircle, Clock } from 'lucide-react';

const PrescriptionUploadDialog = ({
  showUploadDialog,
  setShowUploadDialog,
  prescriptionFile,
  setPrescriptionFile,
  fileInputRef,
}) => {
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
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent
        className="sm:max-w-md p-0 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top fade-in-20 duration-300 max-h-[90vh] flex flex-col"
        aria-describedby="upload-dialog-description"
      >
        {/* Fixed Header */}
        <div className="relative p-8 pb-4 border-b border-gray-200">
        <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
        <CheckCircle
          className="h-10 w-10 text-[#1ABA7F] mx-auto mb-4 prefers-reduced-motion:no-preference:animate-[pulse_1s_ease-in-out_infinite]"
          aria-hidden="true"
        />
          
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91] text-center tracking-tight">
            Prescription Uploaded
          </DialogTitle>
        </DialogHeader>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4">
          <div id="upload-dialog-description" className="space-y-4">
            {/* File Information */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  {(() => {
                    const FileIcon = getFileIcon(prescriptionFile?.type);
                    return <FileIcon className="h-5 w-5 text-green-600" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">
                    {prescriptionFile?.name}
                  </h4>
                  <p className="text-xs text-green-700">
                    {formatFileSize(prescriptionFile?.size)} • {prescriptionFile?.type.split('/')[1].toUpperCase()}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Uploaded
                </Badge>
              </div>
            </div>

            {/* Verification Process Info */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-blue-800">Verification Process</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>Your prescription will be reviewed by our pharmacy team within 24-48 hours.</p>
                    <ul className="space-y-1 mt-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        <span>Prescription validation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        <span>Medication availability check</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        <span>Email notification when ready</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800">What Happens Next?</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>You can continue with your order. The prescription will be processed in the background.</p>
                    <p className="font-medium text-gray-700">You'll receive an email notification when verification is complete.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="p-8 pt-4 border-t border-gray-200">
        <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setPrescriptionFile(null);
              setShowUploadDialog(false);
              fileInputRef.current.value = '';
            }}
            className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F]/20 text-gray-700 hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_10px_rgba(26,186,127,0.2)] transition-all duration-300"
            aria-label="Upload another prescription"
          >
            Upload Another
          </Button>
          <Button
            onClick={() => setShowUploadDialog(false)}
            className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)] transition-all duration-300"
            aria-label="Continue checkout"
          >
            Continue
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionUploadDialog;