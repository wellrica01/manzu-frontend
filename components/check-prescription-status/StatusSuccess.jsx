import { useState, useEffect } from 'react';
import { CheckCircle2, Package } from 'lucide-react';

export default function StatusSuccess({ prescription, guestId, onRedirect }) {
  const [stage, setStage] = useState('checking');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('verified'), 800);
    const timer2 = setTimeout(() => setStage('preparing'), 1800);
    const timer3 = setTimeout(() => setStage('redirecting'), 2800);
    const timer4 = setTimeout(() => {
      onRedirect();
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [guestId, onRedirect]);

  return (
    <div className="flex flex-col items-center gap-8 py-20 animate-in fade-in zoom-in-95 duration-700">
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-emerald-500 rounded-full blur-2xl opacity-60 animate-pulse" />
        
        {stage === 'verified' && (
          <div className="relative w-24 h-24 animate-in zoom-in duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F] to-emerald-600 rounded-full animate-ping opacity-75" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F] to-emerald-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              <CheckCircle2 className="h-14 w-14 text-white animate-in zoom-in duration-300" strokeWidth={3} />
            </div>
          </div>
        )}
        
        {(stage === 'preparing' || stage === 'redirecting') && (
          <div className="relative w-24 h-24 animate-in zoom-in duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#225F91] to-[#1ABA7F] rounded-full animate-pulse opacity-50" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#225F91] to--[#1ABA7F] rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              <Package className="h-14 w-14 text-white animate-bounce" strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="text-center space-y-4 max-w-md">
        {stage === 'verified' && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1ABA7F] to-emerald-600">
              ✓ Prescription Verified!
            </h2>
            <p className="text-gray-700 font-semibold mt-2">
              Your prescription has been approved
            </p>
            <div className="mt-4 p-4 bg-gradient-to-br from-[#1ABA7F]/10 to-emerald-500/10 rounded-xl border-2 border-[#1ABA7F]/30">
              <p className="text-sm text-gray-600">
                {prescription.medications?.length || 0} medication(s) ready for order
              </p>
            </div>
          </div>
        )}
        
        {stage === 'preparing' && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#225F91]">
              Preparing Your Medications
            </h2>
            <p className="text-gray-600 font-medium mt-2">
              Loading your prescription details...
            </p>
          </div>
        )}
        
        {stage === 'redirecting' && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#225F91]">
              Taking You There
            </h2>
            <p className="text-gray-600 font-medium mt-2">
              Redirecting to your prescriptions...
            </p>
          </div>
        )}

        {/* Animated Progress Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            stage === 'verified' ? 'w-6 bg-[#1ABA7F]' : 'bg-gray-300'
          }`} />
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            stage === 'preparing' ? 'w-6 bg-[#225F91]' : 'bg-gray-300'
          }`} />
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            stage === 'redirecting' ? 'w-6 bg-[#225F91]' : 'bg-gray-300'
          }`} />
        </div>
      </div>
    </div>
  );
}