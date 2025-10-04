import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, MapPin, Phone, Navigation, Clock, ArrowUpDown, ArrowUp, ArrowDown, TrendingDown, ChevronDown, Building2, Shield, Store, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOperatingHours, getOperatingHoursTextColor } from '@/lib/pharmacyUtils';

const PharmacyTable = ({ 
  availability, 
  medId, 
  handleAddToCart, 
  isInCart, 
  displayName, 
  isAddingToCart 
}) => {
  const [sortField, setSortField] = useState('price');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);
  const [quantities, setQuantities] = useState({});

  if (!availability || availability.length === 0) {
    return (
      <div className="hidden sm:block text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <MapPin className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg font-bold mb-2">Not available at any verified pharmacy</p>
        <p className="text-gray-500 text-sm">Try adjusting your location or filters</p>
      </div>
    );
  }

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
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-[#1ABA7F]" /> 
      : <ArrowDown className="h-4 w-4 text-[#1ABA7F]" />;
  };

  useEffect(() => {
  const initialQuantities = {};
  availability.forEach(avail => {
    initialQuantities[avail.pharmacyId] = 1; // or a `quantity` prop if passed
  });
  setQuantities(initialQuantities);
}, [availability]);


  return (
    <div className="hidden sm:block">
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-describedby={`pharmacy-comparison-${medId}`}>
            <caption id={`pharmacy-comparison-${medId}`} className="sr-only">
              Comparison of pharmacies for {displayName}
            </caption>
            <thead>
              <tr className="bg-gradient-to-r from-[#1ABA7F]/10 via-[#225F91]/10 to-[#76D1F3]/10">
                <th className="p-5">
                  <button
                    onClick={() => handleSort('name')}
                    className="group flex items-center gap-2 font-bold text-sm text-[#225F91] hover:text-[#1ABA7F] transition-all duration-200"
                    aria-label="Sort by pharmacy name"
                  >
                    <Building2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    Pharmacy
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="p-5">
                  <span className="font-bold text-sm text-[#225F91] flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hours
                  </span>
                </th>
                <th className="p-5">
                  <button
                    onClick={() => handleSort('price')}
                    className="group flex items-center gap-2 font-bold text-sm text-[#225F91] hover:text-[#1ABA7F] transition-all duration-200"
                    aria-label="Sort by price"
                  >
                    <TrendingDown className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    Price
                    {getSortIcon('price')}
                  </button>
                </th>
                <th className="p-5">
                  <button
                    onClick={() => handleSort('distance')}
                    className="group flex items-center gap-2 font-bold text-sm text-[#225F91] hover:text-[#1ABA7F] transition-all duration-200"
                    aria-label="Sort by distance"
                  >
                    <Navigation className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    Distance
                    {getSortIcon('distance')}
                  </button>
                </th>
                <th className="p-5">
                  <span className="font-bold text-sm text-[#225F91] flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Action
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAvailability.map((avail, index) => {
                const validDistances = availability
                  .filter((a) => typeof a.distance_km === 'number' && !isNaN(a.distance_km))
                  .map((a) => a.distance_km);
                const isCheapest = avail.price === Math.min(...availability.map((a) => a.price));
                const isNearest =
                  validDistances.length > 0 &&
                  typeof avail.distance_km === 'number' &&
                  !isNaN(avail.distance_km) &&
                  avail.distance_km === Math.min(...validDistances);

                const key = `${medId}-${avail.pharmacyId}`;
                const adding = !!isAddingToCart[key]; 
                const isExpanded = expandedRow === index;
                
                return (
                  <React.Fragment key={index}>
                    <tr className={cn(
                      "border-t-2 border-gray-100 transition-all duration-300",
                      isExpanded 
                        ? "bg-gradient-to-r from-[#1ABA7F]/5 to-[#225F91]/5" 
                        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
                    )}>
                      <td className="p-5">
                        <div className="flex items-start gap-3">
                          {/* Pharmacy Logo/Image */}
                          <div className="flex-shrink-0">
                            {avail.logoUrl ? (
                              <img
                                src={avail.logoUrl}
                                alt={`${avail.pharmacyName} logo`}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 flex items-center justify-center border-2 border-gray-200">
                                <Store className="h-6 w-6 text-[#225F91]" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {avail.pharmacyName}
                              </h3>
                            </div>
                            {avail.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-[#1ABA7F] mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-600 line-clamp-2 max-w-[300px]">
                                  {avail.address}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedRow(isExpanded ? null : index)}
                            className={cn(
                              "h-8 w-8 p-0 rounded-lg transition-all duration-300 flex-shrink-0",
                              isExpanded 
                                ? "bg-[#1ABA7F]/20 text-[#1ABA7F] hover:bg-[#1ABA7F]/30" 
                                : "text-gray-400 hover:text-[#225F91] hover:bg-gray-100"
                            )}
                            aria-label={isExpanded ? 'Hide details' : 'Show details'}
                          >
                            <ChevronDown className={cn(
                              "h-5 w-5 transition-transform duration-300",
                              isExpanded && "rotate-180"
                            )} />
                          </Button>
                        </div>
                      </td>

                      {/* Operating Hours Column */}
                      <td className="p-5">
                        {avail.operatingHours ? (
                          <div className="space-y-1">
                            {(() => {
                              const formattedHours = formatOperatingHours(avail.operatingHours);
                              if (!formattedHours) {
                                return <p className="text-sm text-gray-600">{avail.operatingHours}</p>;
                              }
                              
                              return (
                                <>
                                  <p className={cn(
                                    "text-sm font-semibold",
                                    getOperatingHoursTextColor(avail.operatingHours)
                                  )}>
                                    {formattedHours.text}
                                  </p>
                                  {formattedHours.status === 'open' && (
                                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-2 py-0.5 text-xs font-bold">
                                      Open Now
                                    </Badge>
                                  )}
                                  {formattedHours.status === 'closed' && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-2 py-0.5 text-xs font-bold">
                                      Closed
                                    </Badge>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Not available</p>
                        )}
                      </td>

                      <td className="p-5">
                      <div className="space-y-1">
                        {quantities[avail.pharmacyId] > 1 ? (
                          <>
                            <p className="text-xs text-gray-500">₦{avail.price.toLocaleString()} each</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-[#225F91]">
                                ₦{(avail.price * quantities[avail.pharmacyId]).toLocaleString()}
                              </span>
                              {isCheapest && (
                                <Badge className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-0 px-2 py-0.5 text-xs font-bold shadow-lg">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Best
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium">x{quantities[avail.pharmacyId]} units</p>
                          </>
                        ) : (
                          <span className="text-xl font-black text-[#225F91]">
                            ₦{avail.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      </td>
                      <td className="p-5">
                        {typeof avail.distance_km === 'number' && !isNaN(avail.distance_km) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-gray-700">
                              {avail.distance_km.toFixed(1)} km
                            </span>
                            {isNearest && (
                              <Badge className="bg-gradient-to-r from-[#76D1F3] to-[#5bc0de] text-white border-0 px-2 py-0.5 text-xs font-bold shadow-lg">
                                <Navigation className="h-3 w-3 mr-1" />
                                Near
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-base font-medium">N/A</span>
                        )}
                      </td>
                      <td className="p-5">
                     <div className="flex flex-col gap-2 space-y-2">
                        {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs font-semibold text-gray-600">Qty:</label>
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-sm">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantities(prev => ({
                            ...prev,
                            [avail.pharmacyId]: Math.max(1, prev[avail.pharmacyId] - 1)
                          }))}
                          disabled={quantities[avail.pharmacyId] <= 1}
                          className="h-6 w-6 flex items-center justify-center text-[#225F91] hover:bg-[#1ABA7F]/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <span className="px-3 text-sm font-bold text-[#225F91] min-w-[2rem] text-center">
                          {quantities[avail.pharmacyId]}
                        </span>

                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQuantities(prev => ({
                            ...prev,
                            [avail.pharmacyId]: prev[avail.pharmacyId] + 1
                          }))}
                          className="h-6 w-6 flex items-center justify-center text-[#225F91] hover:bg-[#1ABA7F]/20 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <Button
                      id={`add-to-cart-${medId}-${avail.pharmacyId}`}
                      onClick={() => handleAddToCart(
                        medId,
                        avail.pharmacyId,
                        displayName,
                        avail.pharmacyName,
                        quantities[avail.pharmacyId] || 1  // Use current quantity state
                      )}
                      disabled={isInCart(medId, avail.pharmacyId) || adding} // disable if already in cart or adding
                      className={cn(
                        'w-full h-10 px-5 text-sm font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group',
                        isInCart(medId, avail.pharmacyId)
                          ? 'bg-gray-400 text-white cursor-not-allowed' // consistent disabled styling
                          : 'bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] active:scale-95'
                      )}
                      aria-label={isInCart(medId, avail.pharmacyId) ? 'Already in Cart' : 'Add to Cart'}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {adding ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            {!isInCart(medId, avail.pharmacyId) && <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
                            {isInCart(medId, avail.pharmacyId) ? '✓ In Cart' : `Add ${quantities[avail.pharmacyId] || 1}`}
                          </>
                        )}
                      </span>

                      {!isInCart(medId, avail.pharmacyId) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      )}
                    </Button>

                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr className="border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                        <td colSpan="5" className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                            {/* Contact & Actions */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-black text-[#225F91] flex items-center gap-2 uppercase tracking-wide">
                                <Phone className="h-4 w-4 text-[#1ABA7F]" />
                                Quick Actions
                              </h4>
                              <div className="space-y-2">
                                {avail.phone && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`tel:${avail.phone}`, '_self')}
                                    className="w-full h-10 text-sm font-semibold border-2 border-[#1ABA7F]/30 text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F] rounded-xl transition-all duration-200 hover:scale-105"
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call: {avail.phone}
                                  </Button>
                                )}
                                {avail.email && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`mailto:${avail.email}`, '_self')}
                                    className="w-full h-10 text-sm font-semibold border-2 border-[#225F91]/30 text-[#225F91] hover:bg-[#225F91]/10 hover:border-[#225F91] rounded-xl transition-all duration-200 hover:scale-105"
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Email Pharmacy
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
                                    className="w-full h-10 text-sm font-semibold border-2 border-[#76D1F3]/30 text-[#225F91] hover:bg-[#76D1F3]/10 hover:border-[#76D1F3] rounded-xl transition-all duration-200 hover:scale-105"
                                  >
                                    <Navigation className="h-4 w-4 mr-2" />
                                    Get Directions
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Pharmacy Details */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-black text-[#225F91] flex items-center gap-2 uppercase tracking-wide">
                                <Shield className="h-4 w-4 text-[#1ABA7F]" />
                                Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                                  <span className="text-xs font-semibold text-gray-600">Status</span>
                                  <Badge 
                                    className={cn(
                                      "text-xs font-bold",
                                      avail.status === 'verified' 
                                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-0" 
                                        : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0"
                                    )}
                                  >
                                    {avail.status === 'verified' ? '✓ Verified' : 'Pending'}
                                  </Badge>
                                </div>
                                {avail.licenseNumber && (
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-gray-600">License</span>
                                    <span className="text-xs font-mono font-bold text-gray-900">{avail.licenseNumber}</span>
                                  </div>
                                )}
                                {avail.ward && (
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-gray-600">Ward</span>
                                    <span className="text-xs font-bold text-gray-900">{avail.ward}</span>
                                  </div>
                                )}
                                {avail.lga && (
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-gray-600">LGA</span>
                                    <span className="text-xs font-bold text-gray-900">{avail.lga}</span>
                                  </div>
                                )}
                                {avail.state && (
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-gray-600">State</span>
                                    <span className="text-xs font-bold text-gray-900">{avail.state}</span>
                                  </div>
                                )}
                              </div>
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
    </div>
  );
};

export default PharmacyTable;