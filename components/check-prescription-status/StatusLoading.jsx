import { Loader2 } from 'lucide-react';

export default function StatusLoading() {
  return (
    <div className="flex flex-col items-center gap-8 py-20">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-xl opacity-50 animate-pulse" />
        <div className="relative w-20 h-20">
          <Loader2 className="w-20 h-20 text-[#1ABA7F] animate-spin" strokeWidth={2.5} />
          <div className="absolute inset-0 rounded-full border-t-4 border-[#225F91] animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
          Checking Status
        </h2>
        <p className="text-gray-600 font-medium">Please wait while we retrieve your prescription details...</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-[#225F91] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );
}
