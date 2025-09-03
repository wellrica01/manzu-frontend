'use client';
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useUserLocation(t) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => toast.error(t("errors.location_fetch"))
    );
  }, [t]);

  return userLocation;
}
