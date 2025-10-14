import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';


// ✅ Enhanced progress UI component
const LocationProgress = ({ progress, isLoadingLocation }) => {
  if (!isLoadingLocation || !progress) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
      case 'timeout':
        return '✗';
      case 'poor_accuracy':
        return '⚠';
      case 'outside_bounds':
        return '📍';
      default:
        return '○';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'timeout':
        return 'text-red-600';
      case 'poor_accuracy':
        return 'text-yellow-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
        <span className="text-sm font-medium text-gray-700">
          Detecting location...
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>
          Sample {progress.current}/{progress.total}
        </span>
        
        {progress.status === 'success' && progress.accuracy && (
          <span className="text-green-600">
            • {Math.round(progress.accuracy)}m ({progress.quality})
          </span>
        )}
        
        {progress.status === 'error' && (
          <span className="text-red-600">
            • {progress.errorType === 'timeout' ? 'Timeout' : 'Error'}
          </span>
        )}
        
        {progress.samplesCollected > 0 && (
          <span className="text-blue-600">
            • {progress.samplesCollected} collected
          </span>
        )}
      </div>

      {/* Visual progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(progress.current / progress.total) * 100}%` }}
        />
      </div>
    </div>
  );
};


const LocationPrompt = ({ onSelectLocation, onEnableLocation, locationStatus, progress, accuracy, isLoadingLocation }) => {
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


    <LocationProgress 
      progress={progress} 
      isLoadingLocation={isLoadingLocation} 
    />

      {/* Action Buttons with stagger */}
      <div className="flex flex-col sm:flex-row gap-3 mt-3 justify-center items-center">
         <Button
            onClick={onEnableLocation}
            disabled={isLoadingLocation}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-6 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-left-4 disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{ animationDelay: '500ms', animationDuration: '500ms' }}
          >
            {isLoadingLocation ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1ABA7F] border-t-transparent" />
                  <span className="text-sm">Detecting location...</span>
                </div>
                {progress && (
                  <span className="text-xs text-gray-500">
                    Sample {progress.current}/{progress.total}
                    {progress.accuracy && ` • ${Math.round(progress.accuracy)}m`}
                  </span>
                )}
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
          className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-6 rounded-xl font-bold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-right-4" 
          style={{ animationDelay: '600ms', animationDuration: '500ms' }}
        >
          <MapPin className="h-5 w-5 mr-2" />
          Choose Location
        </Button>
      </div>



      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-6 animate-in fade-in duration-500" 
         style={{ animationDelay: '700ms' }}>
        Your location helps us show you the closest pharmacies first
      </p>
    </div>
  );
};

export default LocationPrompt;