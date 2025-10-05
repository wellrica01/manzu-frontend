import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

const LocationPrompt = ({ onSelectLocation, onEnableLocation, locationStatus }) => {
  return (
    <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border-2 border-teal-200">
      {/* Icon */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" />
        <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl">
          <MapPin className="h-12 w-12 text-teal-600" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-black text-gray-900 mb-3">
        Select Your Location
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed">
        We found pharmacies that stock this medication! To show you nearby options 
        with accurate prices and delivery times, please select your location.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {locationStatus !== 'granted' && (
          <Button
            onClick={onEnableLocation}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
          >
            <Navigation className="h-5 w-5 mr-2" />
            Use My Location
          </Button>
        )}
        
        <Button
          onClick={onSelectLocation}
          variant="outline"
          className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
        >
          <MapPin className="h-5 w-5 mr-2" />
          Select Manually
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-6">
        Your location helps us show you the closest pharmacies first
      </p>
    </div>
  );
};

export default LocationPrompt;