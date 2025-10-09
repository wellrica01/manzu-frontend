import { useState, useEffect } from 'react';
import { 
  Search, 
  Home, 
  Clock, 
  CheckCircle2, 
  Package, 
  AlertCircle,
  FileText,
  Mail,
  Loader2
} from 'lucide-react';



const StatusSuccess = ({ prescription, guestId, onRedirect }) => {
  const [stage, setStage] = useState('checking');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('verified'), 800);
    const timer2 = setTimeout(() => setStage('preparing'), 1800);
    const timer3 = setTimeout(() => setStage('redirecting'), 2800);
    const timer4 = setTimeout(() => onRedirect(), 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [guestId, onRedirect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 py-20">
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] rounded-full blur-2xl opacity-40 animate-pulse" />
        
        {stage === 'verified' && (
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-[#16a876] rounded-full animate-ping opacity-40" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F] to-[#16a876] rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={2.5} />
            </div>
          </div>
        )}
        
        {(stage === 'preparing' || stage === 'redirecting') && (
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-[#225F91] to-[#1ABA7F] rounded-full animate-pulse opacity-40" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#225F91] to-[#1ABA7F] rounded-full flex items-center justify-center shadow-2xl">
              <Package className="h-14 w-14 text-white animate-bounce" strokeWidth={2} />
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="text-center space-y-6 max-w-md">
        {stage === 'verified' && (
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-[#1ABA7F]">
              Prescription Verified!
            </h2>
            <p className="text-lg text-gray-700 font-medium">
              Your prescription has been approved
            </p>
            <div className="p-5 bg-gradient-to-br from-[#1ABA7F]/10 to-[#16a876]/10 rounded-2xl border border-[#1ABA7F]/20">
              <p className="text-base font-semibold text-gray-700">
                {prescription.medications?.length || 0} medication(s) ready
              </p>
            </div>
          </div>
        )}
        
        {stage === 'preparing' && (
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-[#225F91]">
              Preparing Medications
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Loading your prescription details...
            </p>
          </div>
        )}
        
        {stage === 'redirecting' && (
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-[#225F91]">
              Taking You There
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Redirecting to your prescriptions...
            </p>
          </div>
        )}

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <div className={`h-2 rounded-full transition-all duration-500 ${
            stage === 'verified' ? 'w-8 bg-[#1ABA7F]' : 'w-2 bg-gray-300'
          }`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${
            stage === 'preparing' ? 'w-8 bg-[#225F91]' : 'w-2 bg-gray-300'
          }`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${
            stage === 'redirecting' ? 'w-8 bg-[#225F91]' : 'w-2 bg-gray-300'
          }`} />
        </div>
      </div>
    </div>
  );
}

export default StatusSuccess;