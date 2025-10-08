import { useEffect } from 'react';

export const useAutoPopulateLocation = (
  userLocation,
  geoData,
  dispatch
) => {
  useEffect(() => {
    if (!userLocation || !geoData) return;

    const match = api.reverseGeocode(
      userLocation.lat,
      userLocation.lng,
      geoData
    );

    if (match) {
      dispatch({
        type: api.ACTIONS.SET_FILTERS,
        payload: { state: match.state, lga: '', ward: '' },
      });

      const stateData = geoData.find((s) => s.state === match.state);
      if (stateData) {
        dispatch({
          type: api.ACTIONS.SET_LGAS,
          payload: stateData.lgas.map((lga) => ({
            value: lga.name,
            label: lga.name,
          })),
        });
      }
    }
  }, [userLocation, geoData, dispatch]);
};