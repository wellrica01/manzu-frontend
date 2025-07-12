import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, MapPin, Phone, Navigation, Star, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursColor, getOperatingHoursTextColor } from '@/lib/pharmacyUtils';

const PharmacyTable = ({ availability, medId, handleAddToCart, isInCart, displayName, isAddingToCart }) => {
  const [sortField, setSortField] = useState('price');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);

  if (!availability || availability.length === 0) {
    return (
      <div className="hidden sm:block text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg font-medium">Not available at any verified pharmacy</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your location or filters</p>
      </div>
    );
  }

  // Sort availability based on current sort field and direction
  const sortedAvailability = useMemo(() => {
    return [...availability].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'distance':
          aValue = typeof a.distance_km === 'number' && !isNaN(a.distance_km) ? a.distance_km : Infinity;
          bValue = typeof b.distance_km === 'number' && !isNaN(b.distance_km) ? b.distance_km : Infinity;
          break;
        case 'name':
          aValue = a.pharmacyName.toLowerCase();
          bValue = b.pharmacyName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [availability, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="hidden sm:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-describedby={`pharmacy-comparison-${medId}`}>
          <caption id={`pharmacy-comparison-${medId}`} className="sr-only">
            Comparison of pharmacies for {displayName}
          </caption>
          <thead>
            <tr className="bg-[#1ABA7F]/10 text-sm font-semibold text-[#225F91]">
              <th className="p-4 rounded-tl-xl">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-[#1A4971] transition-colors duration-200"
                  aria-label="Sort by pharmacy name"
                >
                  Pharmacy
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="p-4">
                <button
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-2 hover:text-[#1A4971] transition-colors duration-200"
                  aria-label="Sort by price"
                >
                  Price
                  {getSortIcon('price')}
                </button>
              </th>
              <th className="p-4">
                <button
                  onClick={() => handleSort('distance')}
                  className="flex items-center gap-2 hover:text-[#1A4971] transition-colors duration-200"
                  aria-label="Sort by distance"
                >
                  Distance
                  {getSortIcon('distance')}
                </button>
              </th>
              <th className="p-4 rounded-tr-xl">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedAvailability.map((avail, index) => {
              const validDistances = availability
                .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
                .map((a) => a.distance_km);
              const isCheapest = avail.price === Math.min(...availability.map((a) => a.price));
              const isClosest =
                validDistances.length > 0 &&
                typeof avail.distance_km === 'number' &&
                !isNaN(avail.distance_km) &&
                avail.distance_km === Math.min(...validDistances);
              
              return (
                <React.Fragment key={index}>
                  <tr className="border-t border-[#1ABA7F]/20 hover:bg-[#1ABA7F]/10 transition-colors duration-200">
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {avail.pharmacyName}
                            </h3>
                            {avail.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-600">{avail.rating}</span>
                              </div>
                            )}
                            {avail.operatingHours && (() => {
                              const formattedHours = formatOperatingHours(avail.operatingHours);
                              if (formattedHours?.status === 'open') {
                                return (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                                    24/7
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {avail.address && (
                            <p className="text-sm text-gray-500 truncate max-w-[300px]">
                              {avail.address}
                            </p>
                          )}

                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-[#225F91] hover:bg-[#225F91]/10"
                          aria-label={expandedRow === index ? 'Hide details' : 'Show details'}
                        >
                          {expandedRow === index ? '−' : '+'}
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-800">
                          ₦{avail.price.toLocaleString()}
                        </span>
                        {isCheapest && (
                          <Badge variant="secondary" className="text-xs bg-[#1ABA7F]/20 text-[#1ABA7F] border-[#1ABA7F]/30">
                            Cheapest
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base text-gray-600">
                            {avail.distance_km.toFixed(1)} km
                          </span>
                          {isClosest && (
                            <Badge variant="secondary" className="text-xs bg-[#225F91]/20 text-[#225F91] border-[#225F91]/30">
                              Closest
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-base">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Button
                        id={`add-to-cart-${medId}-${avail.pharmacyId}`}
                        onClick={() => handleAddToCart(medId, avail.pharmacyId, displayName)}
                        disabled={isInCart(medId, avail.pharmacyId) || isAddingToCart[`${medId}-${avail.pharmacyId}`]}
                        className={cn(
                          'h-10 px-5 text-base font-semibold rounded-full transition-all duration-300',
                          isInCart(medId, avail.pharmacyId)
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)]'
                        )}
                        aria-label={isInCart(medId, avail.pharmacyId) ? 'Added to cart' : 'Add to cart'}
                      >
                        {isAddingToCart[`${medId}-${avail.pharmacyId}`] ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Adding...</span>
                          </div>
                        ) : (
                          <>
                            {!isInCart(medId, avail.pharmacyId) && <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />}
                            {isInCart(medId, avail.pharmacyId) ? '✓ Added' : 'Add to Cart'}
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedRow === index && (
                    <tr className="border-t border-[#1ABA7F]/10 bg-gray-50/50">
                      <td colSpan="4" className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Contact & Actions */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[#225F91] flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Contact & Actions
                            </h4>
                            <div className="space-y-2">
                              {avail.phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`tel:${avail.phone}`, '_self')}
                                  className="w-full h-9 text-xs border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                                >
                                  <Phone className="h-3 w-3 mr-2" />
                                  Call Pharmacy
                                </Button>
                              )}
                              {avail.latitude && avail.longitude && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const url = `https://maps.google.com/?q=${avail.latitude},${avail.longitude}`;
                                    window.open(url, '_blank');
                                  }}
                                  className="w-full h-9 text-xs border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                                >
                                  <Navigation className="h-3 w-3 mr-2" />
                                  Get Directions
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Pharmacy Details */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[#225F91] flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Pharmacy Details
                            </h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 min-w-[60px]">Status:</span>
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
                                  <span className="text-gray-600 min-w-[60px]">License:</span>
                                  <span className="text-gray-800 font-mono">{avail.licenseNumber}</span>
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
                            </div>
                          </div>

                          {/* Operating Hours */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[#225F91] flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Operating Hours
                            </h4>
                                                      {avail.operatingHours ? (
                            <div className="space-y-2">
                              {(() => {
                                const formattedHours = formatOperatingHours(avail.operatingHours);
                                if (!formattedHours) return null;
                                
                                return (
                                  <p className={cn("text-sm", getOperatingHoursTextColor(avail.operatingHours))}>
                                    {formattedHours.status === 'unknown' ? avail.operatingHours : formattedHours.text}
                                  </p>
                                );
                              })()}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No operating hours available</p>
                          )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyTable;