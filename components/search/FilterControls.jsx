"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Bookmark, X, MapPin, Filter } from "lucide-react";
import Select from "react-select";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: `2px solid ${state.isFocused ? "#1ABA7F" : "#e5e7eb"}`,
    minHeight: "42px",
    borderRadius: "0.75rem",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(26,186,127,0.1)" : "none",
    "&:hover": { 
      borderColor: "#1ABA7F",
      boxShadow: "0 4px 12px rgba(26,186,127,0.1)"
    },
    transition: "all 0.3s ease",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "8px 12px",
    fontSize: "0.875rem",
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    fontSize: "0.875rem",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    padding: "0 8px",
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#9ca3af",
    fontWeight: "500",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#1f2937",
    fontWeight: "600",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
    fontSize: "0.875rem",
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    border: "2px solid #e5e7eb",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#1f2937",
    backgroundColor: state.isSelected
      ? "#1ABA7F"
      : state.isFocused
      ? "#f0fdf4"
      : "#ffffff",
    "&:hover": { 
      backgroundColor: state.isSelected ? "#16a876" : "#f0fdf4" 
    },
    transition: "all 0.2s ease",
  }),
};

const FilterControls = ({
  filterState,
  setFilterState,
  filterLga,
  setFilterLga,
  filterWard,
  setFilterWard,
  states,
  lgas,
  wards,
  updateLgas,
  updateWards,
  clearFilters,
  handleSearch,
  selectedMedicationId,
  searchTerm,
}) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("savedFilters");
    if (saved) setSavedFilters(JSON.parse(saved));
  }, []);

  useEffect(() => {
    let count = 0;
    if (filterState) count++;
    if (filterLga) count++;
    if (filterWard) count++;
    setActiveFilters(count);
  }, [filterState, filterLga, filterWard]);

  const formatLocationName = (state, lga, ward) => {
    if (!state && !lga && !ward) return "All Locations";
    let name = state || "";
    if (lga) name += `, ${lga}`;
    if (ward) name += ` (Ward: ${ward})`;
    return name;
  };

  const saveCurrentFilter = () => {
    const locationName = formatLocationName(filterState, filterLga, filterWard);
    const currentFilter = {
      id: Date.now(),
      name: locationName,
      filterState,
      filterLga,
      filterWard,
      timestamp: new Date().toISOString(),
    };
    const newSaved = [...savedFilters, currentFilter].slice(-5);
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
  };

  const applySavedFilter = async (filter) => {
    try {
      setFilterState(filter.filterState);
      await updateLgas(filter.filterState);
      setFilterLga(filter.filterLga);
      await updateWards(filter.filterState, filter.filterLga);
      setFilterWard(filter.filterWard);
      if (searchTerm !== undefined) {
        handleSearch(searchTerm);
      }
    } catch (error) {
      console.error("Failed to apply saved filter:", error);
    }
  };

  const deleteSavedFilter = (id) => {
    const newSaved = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
  };

  const locationText = (() => {
    if (!filterState && !filterLga && !filterWard) return null;
    let text = `Filtered by Pharmacies near: ${filterState || ''}`;
    if (filterLga) text += `, ${filterLga}`;
    if (filterWard) text += ` (Ward: ${filterWard})`;
    return text;
  })();

  return (
    <div className="space-y-4">
      {/* Toggle Filter Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="group h-12 px-6 text-sm font-semibold rounded-xl border-2 border-[#1ABA7F]/30 text-[#225F91] hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          <Filter className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
          {showFilters ? 'Hide' : 'Show'} Location Filters
          {activeFilters > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white text-xs font-bold">
              {activeFilters}
            </span>
          )}
        </Button>

        {activeFilters > 0 && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#1ABA7F]" />
            <span className="text-sm font-medium text-gray-600">
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
            </span>
          </div>
        )}
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200">
          <Bookmark className="h-4 w-4 text-[#225F91]" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Saved:</span>
          {savedFilters.map((filter) => (
            <div key={filter.id} className="group flex items-center gap-1 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applySavedFilter(filter)}
                className="h-8 px-3 text-xs font-medium border border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 rounded-l-lg rounded-r-none"
              >
                {filter.name}
              </Button>
              <button
                onClick={() => deleteSavedFilter(filter.id)}
                className="h-8 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-r-lg transition-colors duration-200"
                aria-label={`Delete ${filter.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-[#1ABA7F]/20 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="state-filter" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#1ABA7F]" />
                State
              </label>
              <Select
                inputId="state-filter"
                options={states}
                onChange={(selected) => {
                  const newState = selected?.value || "";
                  setFilterState(newState);
                  updateLgas(newState);
                  if (!newState) {
                    setFilterLga("");
                    setFilterWard("");
                  }
                }}
                value={states.find((o) => o.value === filterState) || null}
                placeholder="Select state..."
                isClearable
                styles={customSelectStyles}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lga-filter" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#225F91]" />
                LGA
              </label>
              <Select
                inputId="lga-filter"
                options={lgas}
                onChange={(selected) => {
                  const newLga = selected?.value || "";
                  setFilterLga(newLga);
                  updateWards(filterState, newLga);
                  if (!newLga) setFilterWard("");
                }}
                value={lgas.find((o) => o.value === filterLga) || null}
                placeholder="Select LGA..."
                isClearable
                isDisabled={!filterState}
                styles={customSelectStyles}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ward-filter" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#76D1F3]" />
                Ward
              </label>
              <Select
                inputId="ward-filter"
                options={wards}
                onChange={(selected) => {
                  setFilterWard(selected?.value || "");
                }}
                value={wards.find((o) => o.value === filterWard) || null}
                placeholder="Select ward..."
                isClearable
                isDisabled={!filterLga}
                styles={customSelectStyles}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {activeFilters > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 px-4 text-sm font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveCurrentFilter}
                  className="h-10 px-4 text-sm font-semibold border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Filter
                </Button>
              </div>
              <Button
                disabled={!selectedMedicationId}      
                onClick={() => handleSearch(selectedMedicationId)}
              >
                Apply Filters
              </Button>

            </div>
          )}
        </div>
      )}

      {/* Location Context */}
      {locationText && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-[#1ABA7F]/5 to-[#225F91]/5 border border-[#1ABA7F]/20">
          <MapPin className="h-4 w-4 text-[#1ABA7F] flex-shrink-0" />
          <p className="text-sm text-gray-700 font-medium italic">
            {locationText}
          </p>
        </div>
      )}
    </div>
  );
};

export default FilterControls;