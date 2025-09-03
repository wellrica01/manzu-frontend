import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Bookmark, X } from "lucide-react";
import Select from "react-select";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: `1px solid ${state.isFocused ? "#1ABA7F" : "#d1d5db"}`,
    minHeight: "34px",
    borderRadius: "0.4rem",
    boxShadow: "none",
    "&:hover": { borderColor: "#1ABA7F" },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 6px",
    fontSize: "0.8rem", // smaller text inside input
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    fontSize: "0.8rem",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    padding: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.8rem",
    color: "#9ca3af",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.8rem",
    color: "#1f2937",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
    fontSize: "0.8rem", // smaller dropdown font
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.8rem",
    color: "#1f2937",
    backgroundColor: state.isSelected
      ? "#225F91"
      : state.isFocused
      ? "#f9fafb"
      : "#ffffff",
    "&:hover": { backgroundColor: "#f9fafb" },
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
  searchTerm,
}) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);

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

  const saveCurrentFilter = () => {
    const currentFilter = {
      id: Date.now(),
      name: `Filter ${savedFilters.length + 1}`,
      filterState,
      filterLga,
      filterWard,
      timestamp: new Date().toISOString(),
    };
    const newSaved = [...savedFilters, currentFilter].slice(-5);
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
  };

  const applySavedFilter = (filter) => {
    setFilterState(filter.filterState);
    setFilterLga(filter.filterLga);
    setFilterWard(filter.filterWard);
    updateLgas(filter.filterState);
    updateWards(filter.filterState, filter.filterLga);
    if (searchTerm) handleSearch(searchTerm);
  };

  const deleteSavedFilter = (id) => {
    const newSaved = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
  };

  return (
    <div className="space-y-3 mt-6 mb-12">
      {/* Saved Filters row */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {savedFilters.map((filter) => (
            <div key={filter.id} className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applySavedFilter(filter)}
                className="h-7 px-2 text-xs border-[#1ABA7F]/40 text-[#225F91]"
              >
                <Bookmark className="h-3 w-3 mr-1" />
                {filter.name}
              </Button>
              <button
                onClick={() => deleteSavedFilter(filter.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filters inline */}
    <div className="flex flex-wrap gap-2">
  <div className="flex-1 min-w-[120px] max-w-[200px]">
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
      placeholder="State"
      isClearable
      styles={customSelectStyles}
    />
  </div>
  <div className="flex-1 min-w-[120px] max-w-[200px]">
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
      placeholder="LGA"
      isClearable
      isDisabled={!filterState}
      styles={customSelectStyles}
    />
  </div>
  <div className="flex-1 min-w-[120px] max-w-[200px]">
    <Select
      inputId="ward-filter"
      options={wards}
      onChange={(selected) => {
        setFilterWard(selected?.value || "");
      }}
      value={wards.find((o) => o.value === filterWard) || null}
      placeholder="Ward"
      isClearable
      isDisabled={!filterLga}
      styles={customSelectStyles}
    />
  </div>
</div>


      {/* Actions row - only show when filters active */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-3 text-sm border-[#1ABA7F] text-[#225F91]"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveCurrentFilter}
              className="h-8 px-3 text-sm border-[#1ABA7F] text-[#225F91]"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
          <Button
            onClick={() => handleSearch(searchTerm)}
            className="h-8 px-4 text-sm font-medium bg-[#225F91] text-white hover:bg-[#1A4971]"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterControls;
