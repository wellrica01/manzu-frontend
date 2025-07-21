import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Navigation, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursColor, getOperatingHoursTextColor } from '@/lib/pharmacyUtils';

const PharmacyCards = ({ availability, medId, handleAddToCart, isInCart, displayName, isAddingToCart }) => {
  const [expandedCard, setExpandedCard] = useState(null);

  if (!availability || availability.length === 0) {
    return (
      <div className="block sm:hidden text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg font-medium">Not available at any verified pharmacy</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your location or filters</p>
      </div>
    );
  }

  return (
    <div className="block sm:hidden space-y-4">
      {availability.map((avail, index) => {
        const validDistances = useMemo(() => {
          return availability
            .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
            .map((a) => a.distance_km);
        }, [availability]);

        const isCheapest = useMemo(() => {
          return avail.price === Math.min(...availability.map((a) => a.price));
        }, [availability, avail.price]);

        const isClosest = useMemo(() => {
          return (
            validDistances.length > 0 &&
            typeof avail.distance_km === 'number' &&
            !isNaN(avail.distance_km) &&
            avail.distance_km === Math.min(...validDistances)
          );
        }, [validDistances, avail.distance_km]);

        const isExpanded = expandedCard === index;

        return (
          <Card 
            key={index} 
            className={cn(
              "border border-[#1ABA7F]/20 rounded-xl bg-white/95 backdrop-blur-sm transition-all duration-300",
              isExpanded && "ring-2 ring-[#1ABA7F]/30 shadow-lg"
            )}
          >
            {/* Main Content */}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                  {avail.pharmacyName}
                    </h3>
                    {/* License number and status badge */}
                    <div className="flex items-center gap-2 mb-1">
                      {avail.licenseNumber && (
                        <span className="text-xs text-gray-400">License: {avail.licenseNumber}</span>
                      )}
                      {avail.status && (
                        <Badge variant="secondary" className={`text-xs ${avail.status === 'VERIFIED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {avail.status.charAt(0) + avail.status.slice(1).toLowerCase()}
                        </Badge>
                      )}
                      {avail.isActive === false && (
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  
                  {avail.address && (
                    <div className="flex items-start gap-1 mb-2">
                      <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-500 line-clamp-2">{avail.address}</p>
                    </div>
                  )}

                  {/* Price and Distance Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-800">₦{avail.price.toLocaleString()}</span>
                      {isCheapest && (
                        <Badge variant="secondary" className="text-xs bg-[#1ABA7F]/20 text-[#1ABA7F] border-[#1ABA7F]/30">
                          Cheapest
                        </Badge>
                      )}
                      {/* In stock */}
                      {typeof avail.stock === 'number' && (
                        <span className="text-xs text-gray-500 ml-2">In stock: {avail.stock}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km)
                          ? `${avail.distance_km.toFixed(1)} km`
                          : 'N/A'}
                      </span>
                      {isClosest && (
                        <Badge variant="secondary" className="text-xs bg-[#225F91]/20 text-[#225F91] border-[#225F91]/30">
                          Closest
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Expiry date */}
                  {avail.expiryDate && (
                    <div className="text-xs text-gray-400 mb-1">Expires: {avail.expiryDate}</div>
                  )}
                  {/* Ward/LGA/State tooltip */}
                  {(avail.ward || avail.lga || avail.state) && (
                    <div className="text-xs text-gray-400 mb-1" title={`Ward: ${avail.ward || 'N/A'}, LGA: ${avail.lga || 'N/A'}, State: ${avail.state || 'N/A'}`}>Location: {avail.ward || ''}{avail.ward && avail.lga ? ', ' : ''}{avail.lga || ''}{(avail.ward || avail.lga) && avail.state ? ', ' : ''}{avail.state || ''}</div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
              <Button
                id={`add-to-cart-${medId}-${avail.pharmacyId}`}
                onClick={() => handleAddToCart(medId, avail.pharmacyId, displayName)}
                disabled={isInCart(medId, avail.pharmacyId) || isAddingToCart[`${medId}-${avail.pharmacyId}`]}
                className={cn(
                        'flex-1 h-10 text-sm rounded-lg transition-all duration-300',
                  isInCart(medId, avail.pharmacyId)
                          ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)]'
                )}
                aria-label={isInCart(medId, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
              >
                {isAddingToCart[`${medId}-${avail.pharmacyId}`] ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Adding...</span>
                        </div>
                      ) : (
                        <span>{isInCart(medId, avail.pharmacyId) ? '✓ Added' : 'Add to Cart'}</span>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCard(isExpanded ? null : index)}
                      className="h-10 px-3 border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isExpanded ? '−' : '+'}
              </Button>
            </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#1ABA7F]/10 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    {/* Pharmacy Status & Verification */}
                    <div className="bg-gradient-to-r from-[#1ABA7F]/5 to-[#225F91]/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-[#1ABA7F] rounded-full"></div>
                        <span className="text-sm font-medium text-[#225F91]">Pharmacy Status</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Status:</span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs",
                              avail.status === 'verified' 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            )}
                          >
                            {avail.status === 'verified' ? '✓ Verified' : 'Pending Verification'}
                          </Badge>
                        </div>
                        {avail.licenseNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">License:</span>
                            <span className="text-gray-800 font-mono text-xs">{avail.licenseNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operating Hours */}
                    {avail.operatingHours && (() => {
                      const formattedHours = formatOperatingHours(avail.operatingHours);
                      if (!formattedHours) return null;
                      
                      return (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className={cn("h-4 w-4", getOperatingHoursColor(avail.operatingHours))} />
                            <span className="text-sm font-medium text-gray-700">Operating Hours</span>
                            {formattedHours.status === 'open' && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                                24/7
                              </Badge>
                            )}
                          </div>
                          <p className={cn("text-sm", getOperatingHoursTextColor(avail.operatingHours))}>
                            {formattedHours.status === 'unknown' ? avail.operatingHours : formattedHours.text}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Location Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 font-medium">Location Details</span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
            {avail.address && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 min-w-[60px]">Address:</span>
                            <span className="text-gray-800">{avail.address}</span>
                          </div>
            )}
                        {avail.ward && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 min-w-[60px]">Ward:</span>
                            <span className="text-gray-800">{avail.ward}</span>
                          </div>
                        )}
                        {avail.lga && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 min-w-[60px]">LGA:</span>
                            <span className="text-gray-800">{avail.lga}</span>
                          </div>
                        )}
                        {avail.state && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 min-w-[60px]">State:</span>
                            <span className="text-gray-800">{avail.state}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact & Actions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 font-medium">Contact & Actions</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {avail.phone ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${avail.phone}`, '_self')}
                            className="flex-1 h-9 text-xs border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call Pharmacy
                          </Button>
                        ) : (
                          <div className="flex-1 h-9 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-md">
                            No phone available
                          </div>
                        )}
                        
                        {avail.latitude && avail.longitude ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `https://maps.google.com/?q=${avail.latitude},${avail.longitude}`;
                              window.open(url, '_blank');
                            }}
                            className="flex-1 h-9 text-xs border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Get Directions
                          </Button>
                        ) : (
                          <div className="flex-1 h-9 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-md">
                            No location data
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default PharmacyCards;