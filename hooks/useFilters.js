import { useState, useEffect } from "react";
import { apiFetch } from "./useApi";
import { toast } from "sonner";

export function useFilters(t) {
  // always arrays, never null
  const [geoData, setGeoData] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [filters, setFilters] = useState({
    state: "",
    lga: "",
    ward: "",
    sortBy: "cheapest",
  });

  // load geo data
  useEffect(() => {
    apiFetch("/data/full.json")
      .then((data) => {
        setGeoData(Array.isArray(data) ? data : []); // ✅ enforce array
        setStates(
          Array.isArray(data)
            ? data.map((s) => ({ value: s.state, label: s.state }))
            : []
        );
      })
      .catch(() => toast.error(t("errors.geo_data")));
  }, [t]);

  // update LGAs when state changes
  const updateLgas = (state) => {
    const stateData = geoData.find((s) => s.state === state);
    setLgas(
      stateData?.lgas?.map((l) => ({ value: l.name, label: l.name })) ?? []
    );
    setWards([]);
    setFilters((f) => ({ ...f, lga: "", ward: "" }));
  };

  // update wards when LGA changes
  const updateWards = (state, lga) => {
    const stateData = geoData.find((s) => s.state === state);
    const lgaData = stateData?.lgas?.find((l) => l.name === lga);
    setWards(
      lgaData?.wards?.map((w) => ({ value: w.name, label: w.name })) ?? []
    );
    setFilters((f) => ({ ...f, ward: "" }));
  };

  // reset everything
  const clearFilters = () => {
    setFilters({ state: "", lga: "", ward: "", sortBy: "cheapest" });
    setLgas([]);
    setWards([]);
  };

  return {
    filters,
    setFilters,
    states,
    lgas,
    wards,
    updateLgas,
    updateWards,
    clearFilters,
    geoData,
  };
}
