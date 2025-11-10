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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-blue-50 to-white border-2 border-teal-200 p-5 animate-in fade-in zoom-in-95 duration-300">
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
  if (error && !isLoadingLocation) {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 via-orange-50 to-white border-2 border-rose-200 shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 rounded-full bg-white shadow-lg">
              <AlertCircle className="h-12 w-12 text-rose-500" strokeWidth={2} />
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-black text-gray-900 text-center mb-3">
          Location Unavailable
        </h3>

        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          {error.details || error.message || "We couldn't detect your location. Please select your area manually."}
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={onEnableLocation}
            className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Navigation className="h-5 w-5 mr-2" strokeWidth={2.5} />
            Try Again
          </Button>

          <Button
            onClick={onSelectLocation}
            variant="outline"
            className="h-14 rounded-2xl border-2 border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <MapPin className="h-5 w-5 mr-2" strokeWidth={2.5} />
            Select Manually
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingLocation) {
    return (
      <div className="p-8 rounded-3xl bg-gradient-to-br from-cyan-50 via-blue-50 to-white border-2 border-cyan-200 shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
              <Navigation className="h-10 w-10 text-cyan-500 animate-pulse" strokeWidth={2} />
            </div>
          </div>
        </div>

        <h3 className="text-xl font-black text-gray-900 text-center mb-3">
          {progress?.message || "Finding your location..."}
        </h3>

        <p className="text-sm text-gray-600 text-center mb-6">
          This usually takes just a few seconds
        </p>

        <div className="space-y-3 mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-pulse"
                 style={{ width: '100%', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
          </div>
        </div>

        {onCancelLocation && (
          <Button
            onClick={onCancelLocation}
            variant="ghost"
            className="w-full h-12 rounded-xl font-semibold hover:bg-gray-100"
          >
            <X className="h-5 w-5 mr-2" strokeWidth={2} />
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-200 shadow-xl animate-in fade-in zoom-in-95 duration-500">
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '2s' }} />
        <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl">
          <div className="relative">
            <MapPin className="h-12 w-12 text-cyan-600" strokeWidth={2} />
            <Sparkles className="h-6 w-6 text-amber-500 absolute -top-1 -right-1 animate-pulse" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <h3 className="text-3xl font-black text-gray-900 text-center mb-4">
        Find Nearby Pharmacies
      </h3>

      <p className="text-gray-600 text-center text-lg mb-8 leading-relaxed max-w-md mx-auto">
        Let us show you the closest pharmacies with the best prices
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onEnableLocation}
          disabled={isLoadingLocation}
          className="flex-1 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Navigation className="h-6 w-6 mr-2" strokeWidth={2.5} />
          Use My Location
        </Button>
        
        <Button
          onClick={onSelectLocation}
          variant="outline"
          disabled={isLoadingLocation}
          className="flex-1 h-16 rounded-2xl border-2 border-cyan-500 text-cyan-600 font-bold hover:bg-cyan-50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <MapPin className="h-6 w-6 mr-2" strokeWidth={2.5} />
          Choose Area
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        🔒 Your location is private and secure
      </p>
    </div>
  );
};

export default LocationPrompt;