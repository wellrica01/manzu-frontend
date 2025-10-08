import { useState, useEffect, useCallback, useMemo } from 'react';

const geoDataCache = { data: null, timestamp: null };
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function useGeoData() {
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        // Check cache first
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
        
        // Cache the data
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

  const reverseGeocode = useCallback((userLat, userLng) => {
    if (!geoData?.length || !userLat || !userLng) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const state of geoData) {
      if (!state?.lgas) continue;
      
      for (const lga of state.lgas) {
        const lgaCoords = lga.wards
          ?.map(w => [w.latitude, w.longitude])
          .filter(c => c[0] && c[1]) || [];
        
        if (lgaCoords.length === 0) continue;
        
        const avgLat = lgaCoords.reduce((sum, [lat]) => sum + lat, 0) / lgaCoords.length;
        const avgLng = lgaCoords.reduce((sum, [, lng]) => sum + lng, 0) / lgaCoords.length;
        const dist = haversineDistance(userLat, userLng, avgLat, avgLng);
        
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { state: state.state, lga: lga.name, distance: dist };
        }
      }
    }
    
    return nearest;
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
    loading,
    error,
  };
}