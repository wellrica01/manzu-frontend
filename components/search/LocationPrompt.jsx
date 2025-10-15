import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, X, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Enhanced progress UI component with better feedback
const LocationProgress = ({ progress, isLoadingLocation, onCancel }) => {
  if (!isLoadingLocation || !progress) return null;

  const getStatusMessage = (status) => {
    switch (status) {
      case 'success':
        return 'Sample collected';
      case 'error':
        return 'Sample failed';
      case 'timeout':
        return 'GPS timeout - move outdoors';
      case 'retrying':
        return progress.error || 'Retrying...';
      case 'poor_accuracy':
        return 'Weak GPS signal';
      case 'outside_bounds':
        return 'Outside Nigeria';
      case 'unavailable':
        return 'GPS unavailable';
      case 'permission_denied':
        return 'Permission denied';
      case 'collecting':
        return 'Reading GPS signal...';
      default:
        return 'Detecting location...';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'timeout':
      case 'outside_bounds':
      case 'unavailable':
      case 'permission_denied':
        return 'text-red-600';
      case 'poor_accuracy':
        return 'text-yellow-600';
      case 'retrying':
        return 'text-blue-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-bold text-gray-700">
            Detecting location...
          </span>
        </div>
        
        {/* ✅ Cancel button */}
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-gray-500 hover:text-gray-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4 mr-1" />
            <span className="text-xs">Cancel</span>
          </Button>
        )}
      </div>

      {/* Status message */}
      <div className={cn("text-xs font-medium", getStatusColor(progress.status))}>
        {getStatusMessage(progress.status)}
      </div>

      {/* Details */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="font-medium">
          Sample {progress.current}/{progress.total}
        </span>
        
        {progress.accuracy && (
          <span className={cn(
            "flex items-center gap-1",
            progress.quality === 'excellent' ? 'text-green-600' :
            progress.quality === 'good' ? 'text-blue-600' :
            progress.quality === 'acceptable' ? 'text-yellow-600' :
            'text-red-600'
          )}>
            {progress.quality === 'excellent' && <Wifi className="h-3 w-3" />}
            {progress.quality === 'good' && <Wifi className="h-3 w-3" />}
            {(progress.quality === 'acceptable' || progress.quality === 'poor') && <WifiOff className="h-3 w-3" />}
            {Math.round(progress.accuracy)}m
          </span>
        )}
        
        {progress.samplesCollected > 0 && (
          <span className="text-green-600 font-medium">
            • {progress.samplesCollected} collected
          </span>
        )}
      </div>

      {/* ✅ Visual progress bar with sample quality indicators */}
      <div className="space-y-1.5">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
        
        {/* Sample quality indicators */}
        <div className="flex gap-1">
          {Array.from({ length: progress.total }).map((_, i) => {
            const isCollected = i < progress.samplesCollected;
            const isCurrent = i === progress.current - 1;
            const isFailed = isCurrent && ['error', 'timeout', 'outside_bounds', 'poor_accuracy'].includes(progress.status);
            
            return (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  isCollected ? "bg-green-500" :
                  isFailed ? "bg-red-500" :
                  isCurrent ? "bg-blue-500 animate-pulse" :
                  "bg-gray-300"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* ✅ Helpful tips based on status */}
      {progress.status === 'retrying' && (
        <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            <strong>Retrying:</strong> {progress.error}
          </p>
        </div>
      )}

      {progress.status === 'poor_accuracy' && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            <strong>Weak signal:</strong> Move to an open area away from tall buildings for better accuracy.
          </p>
        </div>
      )}

      {progress.status === 'outside_bounds' && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            <strong>Outside Nigeria:</strong> Please check your device's GPS settings.
          </p>
        </div>
      )}

      {(progress.status === 'error' || progress.status === 'timeout') && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            <strong>{progress.status === 'timeout' ? 'GPS Timeout' : 'GPS Error'}:</strong> {progress.error || 'Ensure location services are enabled'}
            {progress.consecutiveFailures >= 2 && ' - Multiple failures detected'}
          </p>
        </div>
      )}

      {progress.status === 'unavailable' && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            <strong>GPS Unavailable:</strong> Please enable location services on your device.
          </p>
        </div>
      )}
    </div>
  );
};

const LocationPrompt = ({ 
  onSelectLocation, 
  onEnableLocation, 
  onCancelLocation, // ✅ New prop
  locationStatus, 
  progress, 
  accuracy, 
  isLoadingLocation,
  permissionDenied, // ✅ New prop
}) => {
  return (
    <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border-2 border-teal-200 animate-in fade-in zoom-in-95 duration-500">
      {/* Animated Icon */}
      <div className="relative w-24 h-24 mx-auto mb-6 animate-in zoom-in-50 duration-700" 
           style={{ animationDelay: '200ms' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" 
             style={{ animationDuration: '2s' }} />
        <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl">
          <MapPin className="h-12 w-12 text-teal-600 animate-bounce" 
                  style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Title with slide animation */}
      <h3 className="text-2xl font-black text-[#225F91] mb-3 animate-in slide-in-from-bottom-2 duration-500" 
          style={{ animationDelay: '300ms' }}>
        Select Your Location
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed animate-in fade-in duration-500" 
         style={{ animationDelay: '400ms' }}>
        We found pharmacies with this medication! Share your location to see the closest ones and their prices.
      </p>

      {/* ✅ Permission denied warning */}
      {permissionDenied && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-bold text-red-700 mb-1">Location Access Blocked</p>
              <p className="text-xs text-red-600">
                Please enable location access in your browser settings, then refresh and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress UI */}
      <LocationProgress 
        progress={progress} 
        isLoadingLocation={isLoadingLocation}
        onCancel={onCancelLocation}
      />

      {/* Action Buttons with stagger */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center items-center">
        <Button
          onClick={onEnableLocation}
          disabled={isLoadingLocation || permissionDenied}
          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-6 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-left-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
          style={{ animationDelay: '500ms', animationDuration: '500ms' }}
        >
          {isLoadingLocation ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span className="text-sm">Detecting...</span>
            </div>
          ) : (
            <>
              <Navigation className="h-5 w-5 mr-2" />
              Use My Location
            </>
          )}
        </Button>
        
        <Button
          onClick={onSelectLocation}
          variant="outline"
          disabled={isLoadingLocation}
          className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-6 rounded-xl font-bold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-right-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
          style={{ animationDelay: '600ms', animationDuration: '500ms' }}
        >
          <MapPin className="h-5 w-5 mr-2" />
          Choose Location
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-6 animate-in fade-in duration-500" 
         style={{ animationDelay: '700ms' }}>
        {permissionDenied 
          ? 'Or manually select your state and local government area above'
          : 'Your location helps us show you the closest pharmacies first'
        }
      </p>
    </div>
  );
};

export default LocationPrompt;