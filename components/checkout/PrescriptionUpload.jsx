import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, File as FileIcon } from 'lucide-react';

const PrescriptionUpload = ({ handleFileChange, fileInputRef, prescriptionFile }) => {
  return (
    <div>
      <Label htmlFor="prescription" className="text-sm font-semibold text-primary uppercase tracking-wider">
        Prescription File (PDF, JPEG, PNG)
      </Label>
      <div
        className="mt-3 p-6 border-2 border-dashed border-gray-200/50 rounded-2xl text-center bg-white/95 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300"
        role="region"
        aria-label="Drag and drop prescription file here"
      >
        <Input
          id="prescription"
          name="prescription"
          type="file"
          accept=".pdf,image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <div className="flex flex-col items-center gap-3">
          <Upload
            className="h-8 w-8 text-primary/70 transition-transform duration-300 group-hover:scale-110"
            aria-hidden="true"
          />
          {prescriptionFile ? (
            <div className="flex items-center gap-3 animate-in fade-in-20 duration-300">
              <FileIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-sm sm:text-base font-medium text-gray-900 truncate max-w-[200px]">
                {prescriptionFile.name}
              </span>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Drag your prescription here or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-primary hover:text-primary/80 font-semibold underline transition-colors duration-200"
                aria-label="Browse for prescription file"
              >
                browse
              </button>
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Supports .pdf, .jpg, .jpeg, .png
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;