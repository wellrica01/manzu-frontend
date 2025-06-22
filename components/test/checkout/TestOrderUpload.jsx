import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, File as FileIcon, Eye, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TestOrderUpload = ({ handleFileChange, fileInputRef, testOrderFile }) => {
  const [previewUrl, setPreviewUrl] = useState(testOrderFile ? URL.createObjectURL(testOrderFile) : null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit'); // TODO: Replace with toast
        return;
      }
      if (['image/jpeg', 'image/png'].includes(file.type)) {
        setPreviewUrl(URL.createObjectURL(file));
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

  return (
    <div>
      <Label htmlFor="testOrder" className="text-sm font-semibold text-primary uppercase tracking-wider">
        Test Order File (PDF, JPEG, PNG)
      </Label>
      <div
        className={`mt-3 p-6 border-2 border-dashed rounded-2xl text-center transition-all duration-300 ${
          testOrderFile
            ? 'border-green-500 bg-green-100/80 hover:border-green-600'
            : 'border-gray-200/50 bg-white/95 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
        }`}
        role="region"
        aria-label={testOrderFile ? 'Test order file uploaded' : 'Drag and drop test order file here'}
      >
        <Input
          id="testOrder"
          name="testOrder"
          type="file"
          accept=".pdf,image/jpeg,image/png"
          onChange={onFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <div className="flex flex-col items-center gap-3">
          {testOrderFile ? (
            <>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in-20 duration-300">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                File uploaded successfully
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm sm:text-base font-medium text-gray-900">{testOrderFile.name}</span>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-semibold underline"
                    aria-label="Preview test order file"
                  >
                    <Eye className="h-5 w-5 inline" />
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                  aria-label="Change test order file"
                >
                  <X className="h-5 w-5" />
                  Change File
                </Button>
              </div>
            </>
          ) : (
            <>
              <Upload
                className="h-8 w-8 text-primary/70 transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              />
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Drag your test order here or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-primary hover:text-primary/80 font-semibold underline transition-colors duration-200"
                  aria-label="Browse for test order file"
                >
                  browse
                </button>
              </p>
            </>
          )}
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Supports .pdf, .jpg, .jpeg, .png (max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestOrderUpload;