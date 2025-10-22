import { Button } from '@/components/ui/button';
import { MapPin, Navigation, X, Sparkles, Wifi, Satellite, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎨 Status-aware loading messages
const LOADING_MESSAGES = {
  starting: { text: "Initializing location services", icon: "🔄" },
  trying_network: { text: "Using Wi-Fi/network positioning", icon: "📡" },
  network_success: { text: "Network location found", icon: "✅" },
  network_failed: { text: "Trying GPS satellites", icon: "🛰️" },
  trying_gps: { text: "Acquiring GPS signal", icon: "🛰️" },
  gps_success: { text: "GPS location acquired", icon: "✅" },
  gps_failed: { text: "Finalizing location", icon: "⏳" },
  collecting: { text: "Finding pharmacies near you", icon: "🏥" },
};

// 🎯 Enhanced progress indicator with detailed status
const DetailedProgress = ({ progress, onCancel }) => {
  if (!progress) return null;

  const message = LOADING_MESSAGES[progress.status] || LOADING_MESSAGES.starting;
  const isError = progress.status?.includes('failed');
  const isSuccess = progress.status?.includes('success');

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
            {/* Pulsing rings - only show for active states */}
            {!isError && !isSuccess && (
              <>
                <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20" />
                <div className="absolute inset-0 rounded-full bg-teal-400 animate-pulse opacity-30" 
                     style={{ animationDelay: '0.5s' }} />
              </>
            )}
            
            {/* Center icon */}
            <div className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300",
              isSuccess ? "bg-green-100" : isError ? "bg-amber-100" : "bg-white"
            )}>
              <span className={cn(
                "text-3xl transition-all duration-300",
                !isError && !isSuccess && "animate-bounce"
              )} style={{ animationDuration: '1s' }}>
                {message.icon}
              </span>
            </div>
          </div>
        </div>

        {/* Main message */}
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-gray-800 animate-in fade-in duration-300">
            {progress.message || message.text}...
          </p>
          
          {/* Additional details */}
          {progress.accuracy && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className={cn(
                "font-semibold",
                progress.quality === 'excellent' ? "text-green-600" :
                progress.quality === 'good' ? "text-blue-600" :
                progress.quality === 'acceptable' ? "text-orange-600" :
                "text-amber-600"
              )}>
                Accuracy: ~{progress.accuracy}m
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 capitalize">{progress.quality}</span>
            </div>
          )}

          {/* Helpful context */}
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {progress.status === 'trying_network' && "Checking nearby Wi-Fi and cell towers..."}
            {progress.status === 'trying_gps' && "This may take a moment indoors or in built-up areas"}
            {progress.status === 'network_success' && "Refining with GPS for better accuracy..."}
            {progress.status?.includes('failed') && "Trying alternative method..."}
            {!progress.status && "This usually takes just a few seconds"}
          </p>
        </div>

        {/* Progress bar - show for active states */}
        {!isSuccess && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={cn(
                "h-full rounded-full transition-all duration-300",
                isError 
                  ? "bg-amber-400 w-1/2" 
                  : "bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500 animate-pulse w-full"
              )}
              style={{
                backgroundSize: '200% 100%',
                animation: isError ? 'none' : 'shimmer 1.5s infinite linear, pulse 2s infinite'
              }} />
            </div>
          </div>
        )}

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

// 🎯 Error display with helpful guidance
const LocationError = ({ error, onRetry, onSelectManually, permissionDenied }) => {
  const getErrorIcon = () => {
    if (error?.code === 1) return <AlertCircle className="h-12 w-12 text-red-500" />;
    if (error?.code === 2) return <Wifi className="h-12 w-12 text-amber-500" />;
    if (error?.code === 3) return <Satellite className="h-12 w-12 text-orange-500" />;
    return <MapPin className="h-12 w-12 text-gray-400" />;
  };

  const getErrorTitle = () => {
    if (error?.code === 1) return "Location Access Blocked";
    if (error?.code === 2) return "Location Unavailable";
    if (error?.code === 3) return "Location Timeout";
    return "Couldn't Detect Location";
  };

  const getErrorDescription = () => {
    if (error?.details) return error.details;
    if (error?.message) return error.message;
    return "We couldn't determine your location. You can select your area manually instead.";
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-white border-2 border-amber-200 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-full bg-white shadow-md">
          {getErrorIcon()}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
        {getErrorTitle()}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center mb-6 max-w-md mx-auto leading-relaxed">
        {getErrorDescription()}
      </p>

      {/* Permission help for code 1 */}
      {error?.code === 1 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-bold text-red-800 mb-2">
            🔒 How to enable location access:
          </p>
          <ol className="text-xs text-red-700 space-y-1 ml-4 list-decimal">
            <li>Click the lock icon in your browser's address bar</li>
            <li>Find "Location" and select "Allow"</li>
            <li>Refresh this page and try again</li>
          </ol>
        </div>
      )}

      {/* Tips for other errors */}
      {(error?.code === 2 || error?.code === 3) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Troubleshooting tips:
          </p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
            <li>Move to a window or go outside for better GPS signal</li>
            <li>Enable "High accuracy" in your device location settings</li>
            <li>Turn off any VPN or location spoofing apps</li>
            <li>Ensure location services are enabled on your device</li>
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onRetry}
          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 w-full"
        >
          <Navigation className="h-5 w-5 mr-2" />
          Try Again
        </Button>

        <Button
          onClick={onSelectManually}
          variant="outline"
          className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-full"
        >
          <MapPin className="h-5 w-5 mr-2" />
          Select Manually Instead
        </Button>
      </div>
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
  progress,
  error,
}) => {
  // Show error state if there's an error
  if (error && !isLoadingLocation) {
    return (
      <LocationError
        error={error}
        onRetry={onEnableLocation}
        onSelectManually={onSelectLocation}
        permissionDenied={permissionDenied}
      />
    );
  }

  // Show loading state
  if (isLoadingLocation) {
    return (
      <DetailedProgress 
        progress={progress}
        onCancel={onCancelLocation}
      />
    );
  }

  // Show initial prompt
  return (
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

      {/* Permission info (non-blocking) */}
      {permissionDenied && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg animate-in fade-in duration-300">
          <p className="text-sm font-bold text-amber-800 mb-2">
            🔐 Location Access Needed
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button
          onClick={onEnableLocation}
          disabled={isLoadingLocation}
          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-6 rounded-lg font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-left-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group" 
          style={{ animationDelay: '500ms', animationDuration: '500ms' }}
        >
          <Navigation className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
          <span>Use My Location</span>
        </Button>
        
        <Button
          onClick={onSelectLocation}
          variant="outline"
          disabled={isLoadingLocation}
          className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-8 py-6 rounded-lg font-bold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-right-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group" 
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
          : '✨ We\'ll show you the closest options first'
        }
      </p>
    </div>
  );
};

export default LocationPrompt;