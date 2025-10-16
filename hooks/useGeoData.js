import { useState, useEffect, useCallback, useMemo } from 'react';

const geoDataCache = { data: null, timestamp: null };
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Find nearest LGA by checking all wards within it
function findNearestLGA(userLat, userLng, geoData) {
  if (!geoData?.length || !userLat || !userLng) return null;
  
  const lgaDistances = [];
  
  for (const state of geoData) {
    if (!state?.lgas) continue;
    
    for (const lga of state.lgas) {
      if (!lga?.wards) continue;
      
      let closestWardDistance = Infinity;
      let closestWardCoords = null;
      
      // Find the closest ward within this LGA
      for (const ward of lga.wards) {
        if (!ward.latitude || !ward.longitude) continue;
        
        const dist = haversineDistance(
          userLat, 
          userLng, 
          ward.latitude, 
          ward.longitude
        );
        
        if (dist < closestWardDistance) {
          closestWardDistance = dist;
          closestWardCoords = {
            lat: ward.latitude,
            lng: ward.longitude
          };
        }
      }
      
      // Store this LGA's closest distance
      if (closestWardDistance !== Infinity) {
        lgaDistances.push({
          state: state.state,
          lga: lga.name,
          distance: closestWardDistance,
          coordinates: closestWardCoords
        });
      }
    }
  }
  
  // Find the LGA with the closest ward
  if (lgaDistances.length === 0) return null;
  
  lgaDistances.sort((a, b) => a.distance - b.distance);
  return lgaDistances[0];
}

// Confidence scoring based on distance
function getLocationConfidence(distanceKm) {
  if (distanceKm < 1) return { level: 'high', score: 95 };
  if (distanceKm < 3) return { level: 'good', score: 80 };
  if (distanceKm < 5) return { level: 'medium', score: 60 };
  if (distanceKm < 10) return { level: 'low', score: 40 };
  return { level: 'very-low', score: 20 };
}

// Find all LGAs within radius
function findLGAsInRadius(userLat, userLng, geoData, radiusKm = 20) {
  const lgas = [];
  const seenLGAs = new Set();
  
  for (const state of geoData) {
    if (!state?.lgas) continue;
    
    for (const lga of state.lgas) {
      if (!lga?.wards) continue;
      
      const lgaKey = `${state.state}|${lga.name}`;
      if (seenLGAs.has(lgaKey)) continue;
      
      let closestWardDistance = Infinity;
      
      for (const ward of lga.wards) {
        if (!ward.latitude || !ward.longitude) continue;
        
        const distance = haversineDistance(
          userLat,
          userLng,
          ward.latitude,
          ward.longitude
        );
        
        if (distance < closestWardDistance) {
          closestWardDistance = distance;
        }
      }
      
      if (closestWardDistance <= radiusKm) {
        lgas.push({
          state: state.state,
          lga: lga.name,
          distance: closestWardDistance
        });
        seenLGAs.add(lgaKey);
      }
    }
  }
  
  // Sort by distance
  return lgas.sort((a, b) => a.distance - b.distance);
}

export function useGeoData() {
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        if (
          geoDataCache.data &&
          geoDataCache.timestamp &&
          Date.now() - geoDataCache.timestamp < CACHE_DURATION
        ) {
          setGeoData(geoDataCache.data);
          setLoading(false);
          return;
        }

        const response = await fetch('/data/full.json');
        if (!response.ok) throw new Error('Failed to load location data');
        
        const data = await response.json();
        
        geoDataCache.data = data;
        geoDataCache.timestamp = Date.now();
        
        setGeoData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load geo data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadGeoData();
  }, []);

  /**
   * Reverse Geocode: Find nearest state and LGA
   * 
   * ⚠️ NOTE: Returns both state AND lga for informational purposes,
   * but the consuming component (MedSearchBar) should ONLY auto-set
   * the state filter, leaving LGA for manual user selection.
   * 
   * The LGA is included in the response to:
   * 1. Show users which LGA is nearest (for informational context)
   * 2. Calculate distance and confidence scores
   * 3. Provide helpful toast messages
   * 
   * @returns {Object} { state, lga, distance, confidence, nearbyLGAs }
   */
  const reverseGeocode = useCallback((userLat, userLng, options = {}) => {
    const nearest = findNearestLGA(userLat, userLng, geoData);
    
    if (!nearest) return null;
    
    const confidence = getLocationConfidence(nearest.distance);
    
    return {
      ...nearest,
      confidence,
      // Include nearby LGAs for better UX (showing user options)
      nearbyLGAs: options.includeNearby 
        ? findLGAsInRadius(userLat, userLng, geoData, 20).slice(0, 5)
        : []
    };
  }, [geoData]);

  // Search LGAs by radius (for finding pharmacies across multiple LGAs)
  const findNearbyLGAs = useCallback((userLat, userLng, radiusKm = 20) => {
    return findLGAsInRadius(userLat, userLng, geoData, radiusKm);
  }, [geoData]);

  const states = useMemo(() => 
    geoData.map(state => ({ value: state.state, label: state.state })),
    [geoData]
  );

  const getLgas = useCallback((stateName) => {
    const state = geoData.find(s => s.state === stateName);
    return state?.lgas?.map(lga => ({ value: lga.name, label: lga.name })) || [];
  }, [geoData]);

  const getWards = useCallback((stateName, lgaName) => {
    const state = geoData.find(s => s.state === stateName);
    const lga = state?.lgas?.find(l => l.name === lgaName);
    return lga?.wards?.map(ward => ({ value: ward.name, label: ward.name })) || [];
  }, [geoData]);

  return {
    geoData,
    states,
    getLgas,
    getWards,
    reverseGeocode,
    findNearbyLGAs,
    loading,
    error,
  };
}