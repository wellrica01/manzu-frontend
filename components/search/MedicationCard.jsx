import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, MapPin, Clock, Star } from 'lucide-react';
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';
import { cn } from '@/lib/utils';

const MedicationCard = ({ med, handleAddToCart, isInCart, isAddingToCart }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getAvailabilityCount = () => {
    return med.availability?.length || 0;
  };

  const getAveragePrice = () => {
    if (!med.availability?.length) return null;
    const total = med.availability.reduce((sum, avail) => sum + avail.price, 0);
    return Math.round(total / med.availability.length);
  };

  const getMinPrice = () => {
    if (!med.availability?.length) return null;
    return Math.min(...med.availability.map(avail => avail.price));
  };

  const averagePrice = getAveragePrice();
  const minPrice = getMinPrice();
  const availabilityCount = getAvailabilityCount();

  return (
    <Card
      className="relative shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30"
    >
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/5 to-[#225F91]/5 opacity-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 rounded-br-2xl" />
      <div className="absolute top-4 right-4">
        <div className="w-2 h-2 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full animate-pulse" />
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-[#1ABA7F]/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#225F91]/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
      
      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-[#1ABA7F]/5 to-[#225F91]/5 px-6 py-3 border-b border-[#1ABA7F]/10 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-[#225F91]" />
              <span className="text-gray-600">{availabilityCount} pharmacies</span>
            </div>
            {minPrice && (
              <div className="flex items-center gap-1">
                <span className="text-[#1ABA7F] font-semibold">From ₦{minPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[#225F91] hover:text-[#1A4971] hover:bg-[#225F91]/10"
          >
            <Info className="h-4 w-4 mr-1" />
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>

      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent relative z-10">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight">
                {med.displayName}
              </CardTitle>
              {/* Subtitle: Form and Strength */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-base text-gray-700 font-medium">
                  {med.form ? med.form.charAt(0) + med.form.slice(1).toLowerCase() : ''}
                  {med.strengthValue && med.strengthUnit ? ` • ${med.strengthValue}${med.strengthUnit}` : ''}
                </span>
                {med.prescriptionRequired && (
                  <Badge variant="secondary" className="bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Prescription Required
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  {med.genericName || 'Generic N/A'}
                </span>
              </div>
              {/* Manufacturer */}
              {med.manufacturer && (
                <div className="text-sm text-gray-400 mt-1">Manufacturer: {med.manufacturer}</div>
              )}
            </div>
            {med.imageUrl && (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                <img
                  src={med.imageUrl}
                  alt={med.displayName}
                  className="w-full h-full object-cover rounded-xl border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
          </div>
          {/* Details Section */}
          {showDetails && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">NAFDAC Code:</span>
                  <span className="ml-2 text-gray-600">{med.nafdacCode || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Form:</span>
                  <span className="ml-2 text-gray-600">{med.form || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Strength:</span>
                  <span className="ml-2 text-gray-600">{med.strengthValue && med.strengthUnit ? `${med.strengthValue}${med.strengthUnit}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Manufacturer:</span>
                  <span className="ml-2 text-gray-600">{med.manufacturer || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#225F91]">Compare Pharmacies</h3>
          {availabilityCount > 0 && (
            <Badge variant="outline" className="border-[#1ABA7F] text-[#1ABA7F]">
              {availabilityCount} available
            </Badge>
          )}
        </div>
        
        {availabilityCount === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">Not available at any verified pharmacy</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your location or filters</p>
          </div>
        ) : (
          <>
            <PharmacyCards
              availability={med.availability}
              medId={med.id}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              displayName={med.displayName}
              isAddingToCart={isAddingToCart}
            />
            <PharmacyTable
              availability={med.availability}
              medId={med.id}
              handleAddToCart={handleAddToCart}
              isInCart={isInCart}
              displayName={med.displayName}
              isAddingToCart={isAddingToCart}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationCard;