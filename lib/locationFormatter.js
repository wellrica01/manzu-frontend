function formatLocationName(state, lga, ward) {
  if (!state && !lga && !ward) return "All Locations";
  let name = state || "";
  if (lga) name += `, ${lga}`;
  if (ward) name += ` (Ward: ${ward})`;
  return name;
}
