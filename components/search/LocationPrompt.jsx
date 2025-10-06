import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

const LocationPrompt = ({ onSelectLocation, onEnableLocation, locationStatus }) => {
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
      <h3 className="text-2xl font-black text-gray-900 mb-3 animate-in slide-in-from-bottom-2 duration-500" 
          style={{ animationDelay: '300ms' }}>
        Select Your Location
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed animate-in fade-in duration-500" 
         style={{ animationDelay: '400ms' }}>
        We found pharmacies that stock this medication! To show you nearby options 
        with accurate prices and delivery times, please select your location.
      </p>

      {/* Action Buttons with stagger */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {locationStatus !== 'granted' && (
          <Button
            onClick={onEnableLocation}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-6 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-left-4" 
            style={{ animationDelay: '500ms', animationDuration: '500ms' }}
          >
            <Navigation className="h-5 w-5 mr-2" />
            Use My Location
          </Button>
        )}
        
        <Button
          onClick={onSelectLocation}
          variant="outline"
          className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-6 rounded-xl font-bold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-in slide-in-from-right-4" 
          style={{ animationDelay: '600ms', animationDuration: '500ms' }}
        >
          <MapPin className="h-5 w-5 mr-2" />
          Select Manually
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