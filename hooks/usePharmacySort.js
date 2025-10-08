import { useState, useMemo, useCallback } from 'react';
import { isPharmacyOpenNow } from '@/lib/pharmacyUtils';

const SORT_OPTIONS = {
  DEFAULT: 'default',
  CHEAPEST: 'cheapest',
  NEAREST: 'nearest'
};

const isValidDistance = (distance) => {
  return typeof distance === 'number' && !isNaN(distance) && distance >= 0;
};

/**
 * Custom hook for pharmacy sorting and filtering logic
 * 
 * Features:
 * - Multiple sort strategies (default, cheapest, nearest)
 * - Open/closed pharmacy filtering
 * - Lowest price calculation across pharmacies
 * - Memoized calculations for performance
 * 
 * @param {Array} pharmacyRecommendations - Array of pharmacy objects
 * @param {Array} medications - Array of medication objects with quantities
 * @param {boolean} filterOpen - Whether to filter for only open pharmacies
 * 
 * @returns {Object} {
 *   sortOption: current sort option,
 *   setSortOption: function to update sort,
 *   sortedPharmacies: filtered and sorted pharmacy array,
 *   lowestPrices: map of medication IDs to lowest prices,
 *   minDistance: minimum distance across all pharmacies,
 *   minTotalPrice: minimum total price across all pharmacies
 * }
 */
export function usePharmacySort(pharmacyRecommendations, medications, filterOpen = false) {
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.DEFAULT);

  // Get quantity for a medication
  const getQty = useCallback((medId) => {
    const medication = medications?.find(m => m?.id === medId);
    return medication?.quantity || 1;
  }, [medications]);

  // Calculate lowest price for each medication across all pharmacies
  const lowestPrices = useMemo(() => {
    if (!pharmacyRecommendations?.length) return {};
    
    const prices = {};
    
    for (const pharm of pharmacyRecommendations) {
      if (!pharm?.meds) continue;
      
      for (const med of pharm.meds) {
        if (!med?.id || typeof med.price !== 'number') continue;
        
        if (!prices[med.id] || med.price < prices[med.id]) {
          prices[med.id] = med.price;
        }
      }
    }
    
    return prices;
  }, [pharmacyRecommendations]);

  // Enrich pharmacies with calculated fields
  const enrichedPharmacies = useMemo(() => {
    if (!pharmacyRecommendations?.length) return [];
    
    return pharmacyRecommendations.map(pharm => {
      // Calculate total price with quantities
      const totalPrice = (pharm?.meds || []).reduce((sum, med) => {
        if (!med?.id || typeof med.price !== 'number') return sum;
        const qty = getQty(med.id);
        return sum + (med.price * qty);
      }, 0);
      
      return { 
        ...pharm, 
        trueTotalPrice: totalPrice,
        validDistance: isValidDistance(pharm?.distance_km)
      };
    });
  }, [pharmacyRecommendations, getQty]);

  // Sort and filter pharmacies
  const sortedPharmacies = useMemo(() => {
    if (!enrichedPharmacies?.length) return [];

    let filtered = enrichedPharmacies;
    
    // Apply open filter if enabled
    if (filterOpen) {
      filtered = enrichedPharmacies.filter(pharm => 
        isPharmacyOpenNow(pharm?.operatingHours)
      );
    }

    // Create copy for sorting (don't mutate original)
    const sorted = [...filtered];
    
    // Apply sort strategy
    switch (sortOption) {
      case SORT_OPTIONS.CHEAPEST:
        // Sort by total price (ascending)
        return sorted.sort((a, b) => a.trueTotalPrice - b.trueTotalPrice);
      
      case SORT_OPTIONS.NEAREST:
        // Sort by distance, invalid distances go to end
        return sorted.sort((a, b) => {
          if (!a.validDistance) return 1;
          if (!b.validDistance) return -1;
          return a.distance_km - b.distance_km;
        });
      
      case SORT_OPTIONS.DEFAULT:
      default:
        // Sort by medication count (descending)
        return sorted.sort((a, b) => (b?.medCount || 0) - (a?.medCount || 0));
    }
  }, [enrichedPharmacies, sortOption, filterOpen]);

  // Calculate global minimums for badge display
  const { minDistance, minTotalPrice } = useMemo(() => {
    if (!enrichedPharmacies?.length) {
      return { minDistance: null, minTotalPrice: null };
    }

    const validDistances = enrichedPharmacies
      .filter(p => p.validDistance)
      .map(p => p.distance_km);
    
    const prices = enrichedPharmacies
      .map(p => p.trueTotalPrice)
      .filter(p => typeof p === 'number' && !isNaN(p));

    return {
      minDistance: validDistances.length > 0 ? Math.min(...validDistances) : null,
      minTotalPrice: prices.length > 0 ? Math.min(...prices) : null
    };
  }, [enrichedPharmacies]);

  return {
    sortOption,
    setSortOption,
    sortedPharmacies,
    lowestPrices,
    minDistance,
    minTotalPrice,
  };
}

export { SORT_OPTIONS };