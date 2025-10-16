import { Button } from '@/components/ui/button';
import { MapPin, Navigation, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎨 Friendly loading messages that rotate
const LOADING_MESSAGES = [
  { text: "Finding pharmacies near you", icon: "🔍" },
  { text: "Almost there", icon: "⚡" },
  { text: "Getting the best prices", icon: "💰" },
  { text: "Just a moment", icon: "✨" },
];

// 🎯 Simple progress indicator
const FriendlyProgress = ({ isLoadingLocation, onCancel, currentStep = 0 }) => {
  if (!isLoadingLocation) return null;

  const message = LOADING_MESSAGES[currentStep % LOADING_MESSAGES.length];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-blue-50 to-white border-2 border-teal-200 p-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-100/20 via-blue-100/20 to-teal-100/20 animate-shimmer" 
           style={{ 
             backgroundSize: '200% 100%',
             animation: 'shimmer 2s infinite linear'
           }} />
      
      <div className="relative z-10 space-y-4">
        {/* Animated icon */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-full bg-teal-400 animate-pulse opacity-30" 
                 style={{ animationDelay: '0.5s' }} />
            
            {/* Center icon */}
            <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl animate-bounce" style={{ animationDuration: '1s' }}>
                {message.icon}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-gray-800 animate-in fade-in duration-300">
            {message.text}...
          </p>
          <p className="text-sm text-gray-600">
            This usually takes just a few seconds
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500 rounded-full animate-pulse"
                 style={{
                   width: '100%',
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 1.5s infinite linear, pulse 2s infinite'
                 }} />
          </div>
        </div>

        {/* Cancel button */}
        {onCancel && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

const LocationPrompt = ({ 
  onSelectLocation, 
  onEnableLocation, 
  onCancelLocation,
  locationStatus, 
  isLoadingLocation,
  permissionDenied,
}) => {
  return (
    <div className="space-y-6">
      {/* Loading State - Show this while detecting */}
      {isLoadingLocation ? (
        <FriendlyProgress 
          isLoadingLocation={isLoadingLocation}
          onCancel={onCancelLocation}
          currentStep={Math.floor(Date.now() / 2000) % LOADING_MESSAGES.length}
        />
      ) : (
        /* Initial Prompt - Friendly & Inviting */
        <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border-2 border-teal-200 animate-in fade-in zoom-in-95 duration-500">
          {/* Friendly Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6 animate-in zoom-in-50 duration-700" 
               style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" 
                 style={{ animationDuration: '2s' }} />
            <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl">
              <div className="relative">
                <MapPin className="h-12 w-12 text-teal-600" />
                <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Friendly Title */}
          <h3 className="text-2xl font-black text-[#225F91] mb-3 animate-in slide-in-from-bottom-2 duration-500" 
              style={{ animationDelay: '300ms' }}>
            Find Pharmacies Near You
          </h3>

          {/* Simple Description */}
          <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed animate-in fade-in duration-500" 
             style={{ animationDelay: '400ms' }}>
            We found this medication! Let us show you the closest pharmacies with the best prices.
          </p>

          {/* Permission Denied Warning - Friendly */}
          {permissionDenied && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl animate-in fade-in duration-300">
              <p className="text-sm font-bold text-amber-800 mb-2">
                📍 Location Access Needed
              </p>
              <p className="text-xs text-amber-700 mb-3">
                Please allow location access in your browser to see nearby pharmacies. Don't worry, we only use this to show you relevant results!
              </p>
              <button
                onClick={() => window.open('https://support.google.com/chrome/answer/142065', '_blank')}
                className="text-xs text-amber-700 underline hover:text-amber-900 font-medium"
              >
                How to enable location →
              </button>
            </div>
          )}

          {/* Action Buttons - Clear & Friendly */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={onEnableLocation}
              disabled={isLoadingLocation || permissionDenied}
              className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-6 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-left-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group" 
              style={{ animationDelay: '500ms', animationDuration: '500ms' }}
            >
              <Navigation className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              <span>Use My Location</span>
            </Button>
            
            <Button
              onClick={onSelectLocation}
              variant="outline"
              disabled={isLoadingLocation}
              className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-8 py-6 rounded-xl font-bold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-right-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group" 
              style={{ animationDelay: '600ms', animationDuration: '500ms' }}
            >
              <MapPin className="h-5 w-5 mr-2 group-hover:bounce transition-transform duration-300" />
              <span>Choose My Area</span>
            </Button>
          </div>

          {/* Reassuring Text */}
          <p className="text-xs text-gray-500 mt-6 animate-in fade-in duration-500" 
             style={{ animationDelay: '700ms' }}>
            {permissionDenied 
              ? '🔒 Your location is private and secure'
              : '✨ We`ll show you the closest options first'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPrompt;