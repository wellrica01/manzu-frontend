"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save, Bookmark, X, MapPin, Filter, Badge } from "lucide-react";
import Select from "react-select";
import { cn } from '@/lib/utils';

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
    fontSize: "16px",
    "@media (min-width: 640px)": {
      fontSize: "0.875rem",
    },
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
  states,
  lgas,
  clearFilters,
  showFilters,
  setShowFilters,
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
    setActiveFilters(count);
  }, [filterState, filterLga]);

  const saveCurrentFilter = () => {
    const locationName = `${filterState || 'All'}${filterLga ? `, ${filterLga}` : ''}`;
    const currentFilter = {
      id: Date.now(),
      name: locationName,
      filterState,
      filterLga,
      timestamp: new Date().toISOString(),
    };
    const newSaved = [...savedFilters, currentFilter].slice(-5);
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
  };

  const applySavedFilter = (filter) => {
    setFilterState(filter.filterState);
    setFilterLga(filter.filterLga);
  };

  const deleteSavedFilter = (id) => {
    const newSaved = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(newSaved);
    localStorage.setItem("savedFilters", JSON.stringify(newSaved));
  };

return (
  <div className="space-y-5">
    {/* Toggle Section */}
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="group relative h-12 sm:h-14 px-6 sm:px-8 font-bold rounded-2xl border-2 overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95"
      >
        {/* Gradient Background */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r transition-opacity duration-500",
            showFilters
              ? "from-emerald-500 to-cyan-500 opacity-100"
              : "from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100"
          )}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <Filter
            className={cn(
              "h-5 w-5 transition-all duration-500",
              showFilters
                ? "rotate-180 text-white"
                : "rotate-0 text-gray-700 group-hover:text-emerald-600"
            )}
            strokeWidth={2.5}
          />
          <span
            className={cn(
              "transition-colors duration-300 font-bold tracking-wide",
              showFilters ? "text-white" : "text-gray-700 group-hover:text-emerald-600"
            )}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </span>

          {activeFilters > 0 && (
            <Badge className="bg-white text-emerald-600 font-black text-xs px-2.5 py-1 shadow-md">
              {activeFilters}
            </Badge>
          )}
        </div>
      </Button>

      {activeFilters > 0 && (
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-emerald-700">
            {activeFilters} Active
          </span>
        </div>
      )}
    </div>

    {/* Saved Filters */}
    {savedFilters.length > 0 && (
      <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />
          <span className="text-xs font-black text-gray-600 uppercase tracking-wider">
            Saved:
          </span>
        </div>

        {savedFilters.map((filter, index) => (
          <div
            key={filter.id}
            className="group flex items-center bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-emerald-300"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applySavedFilter(filter)}
              className="h-9 px-3 text-sm font-semibold text-gray-700 hover:text-emerald-600 rounded-l-xl rounded-r-none hover:bg-emerald-50 transition-all duration-300"
            >
              {filter.name}
            </Button>
            <button
              onClick={() => deleteSavedFilter(filter.id)}
              className="h-9 px-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-r-xl transition-all duration-300 border-l border-gray-100"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    )}

    {/* Filter Panel */}
    {showFilters && (
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-gray-50 to-white border border-emerald-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* State */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
              <MapPin className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
              State
            </label>
            <select
              value={filterState}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) clearFilters();
                else {
                  setFilterState(value);
                  setFilterLga("");
                }
              }}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 font-medium text-gray-700 bg-white shadow-sm hover:shadow transition-all duration-300"
            >
              <option value="">Select state...</option>
              {states.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>

          {/* LGA */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
              <MapPin className="h-4 w-4 text-cyan-500" strokeWidth={2.5} />
              LGA
            </label>
            <select
              value={filterLga}
              onChange={(e) => setFilterLga(e.target.value)}
              disabled={!filterState}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 font-medium text-gray-700 bg-white shadow-sm hover:shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select LGA...</option>
              {lgas.map((lga) => (
                <option key={lga.value} value={lga.value}>
                  {lga.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Controls */}
        {activeFilters > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="h-11 px-6 font-semibold rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Clear All
              </Button>
              <Button
                onClick={saveCurrentFilter}
                className="h-11 px-6 font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Save className="h-5 w-5 mr-2" strokeWidth={2.5} />
                Save Filter
              </Button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">Active</span>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);


};


export default FilterControls;