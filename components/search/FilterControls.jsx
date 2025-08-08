import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Save, Bookmark, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import Select from 'react-select';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: `1px solid ${state.isFocused ? 'rgba(26,186,127,0.5)' : 'rgba(26,186,127,0.3)'}`,
    boxShadow: state.isFocused ? '0 0 10px rgba(26,186,127,0.3)' : 'none',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '0.5rem',
    padding: '0.25rem',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: 'rgba(26,186,127,0.5)',
      boxShadow: '0 0 15px rgba(26,186,127,0.2)',
    },
  }),
  input: (provided) => ({
    ...provided,
    fontSize: '1rem',
    color: '#1f2937',
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: '1rem',
    color: '#9ca3af',
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: '1rem',
    color: '#1f2937',
  }),
  menu: (provided) => ({
    ...provided,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(26,186,127,0.3)',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    marginTop: '0.25rem',
    zIndex: 20,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '1rem',
    color: '#1f2937',
    backgroundColor: state.isSelected ? '#225F91' : state.isFocused ? '#f9fafb' : '#ffffff',
    '&:hover': { backgroundColor: '#f9fafb' },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': { color: '#dc2626' },
  }),
};

const FilterControls = ({
  filterState,
  setFilterState,
  filterLga,
  setFilterLga,
  filterWard,
  setFilterWard,
  sortBy,
  setSortBy,
  states,
  lgas,
  wards,
  geoData,
  updateLgas,
  updateWards,
  clearFilters,
  handleSearch,
  searchTerm,
  showFilters,
  setShowFilters,
}) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('savedFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    let count = 0;
    if (filterState) count++;
    if (filterLga) count++;
    if (filterWard) count++;
    if (sortBy !== 'cheapest') count++;
    setActiveFilters(count);
  }, [filterState, filterLga, filterWard, sortBy]);

  const saveCurrentFilter = () => {
    const currentFilter = {
      id: Date.now(),
      name: `Filter ${savedFilters.length + 1}`,
      filterState,
      filterLga,
      filterWard,
      sortBy,
      timestamp: new Date().toISOString(),
    };
    const newSavedFilters = [...savedFilters, currentFilter].slice(-5);
    setSavedFilters(newSavedFilters);
    localStorage.setItem('savedFilters', JSON.stringify(newSavedFilters));
  };

  const applySavedFilter = (filter) => {
    setFilterState(filter.filterState);
    setFilterLga(filter.filterLga);
    setFilterWard(filter.filterWard);
    setSortBy(filter.sortBy);
    updateLgas(filter.filterState);
    updateWards(filter.filterState, filter.filterLga);
    if (searchTerm) handleSearch(searchTerm);
  };

  const deleteSavedFilter = (filterId) => {
    const newSavedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(newSavedFilters);
    localStorage.setItem('savedFilters', JSON.stringify(newSavedFilters));
  };

  const quickFilters = [
    { id: 'nearest', label: 'Nearest', icon: MapPin, sortBy: 'closest' },
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign, sortBy: 'cheapest' },
  ];

  return (
    <div className="w-full space-y-4">
      <div
        className="flex justify-between items-center px-4 py-3 bg-[#1ABA7F]/5 rounded-lg cursor-pointer hover:bg-[#1ABA7F]/10 transition-colors duration-300"
        onClick={() => setShowFilters(!showFilters)}
        role="button"
        aria-expanded={showFilters}
        aria-controls="filter-content"
      >
        <div className="flex items-center gap-3">
          <Filter className="h-6 w-6 text-[#225F91]" />
          <span className="text-base font-bold text-[#225F91] tracking-tight">
            {showFilters ? 'Hide Filters' : 'Advanced Filters'}
          </span>
          {activeFilters > 0 && (
            <Badge variant="secondary" className="bg-[#1ABA7F]/20 text-[#1ABA7F] border-[#1ABA7F]/30">
              {activeFilters} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!showFilters && activeFilters === 0 && (
            <span className="text-xs text-gray-500 hidden sm:block">
              Location & Sort options
            </span>
          )}
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-red-500 hover:text-red-600 hover:bg-red-100/50 p-2 rounded-full transition-all duration-200"
              aria-label="Clear all filters"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div
          id="filter-content"
          className="px-4 py-4 space-y-6 animate-in slide-in-from-top-10 fade-in-20 duration-500"
        >
          <div className="space-y-3">
            <Label className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider">
              Quick Filters
            </Label>
            <div className="flex gap-2 flex-wrap">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={sortBy === filter.sortBy ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy(filter.sortBy);
                    if (searchTerm) handleSearch(searchTerm);
                  }}
                  className={cn(
                    'h-9 px-4 text-sm sm:text-base font-medium rounded-full transition-all duration-300',
                    sortBy === filter.sortBy
                      ? 'bg-[#225F91] text-white shadow-[0_0_10px_rgba(34,95,145,0.3)]'
                      : 'border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50'
                  )}
                >
                  <filter.icon className="h-4 w-4 mr-1" />
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {savedFilters.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Saved Filters
              </Label>
              <div className="flex gap-2 flex-wrap">
                {savedFilters.map((filter) => (
                  <div key={filter.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applySavedFilter(filter)}
                      className="h-8 px-3 text-xs border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
                    >
                      <Bookmark className="h-3 w-3 mr-1" />
                      {filter.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSavedFilter(filter.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      aria-label="Delete saved filter"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-600 text-sm sm:text-base tracking-wide">
            Filter by location and sort results to find the best pharmacies
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="state-filter"
                className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider"
              >
                State
              </Label>
              <Select
                inputId="state-filter"
                options={states}
                onChange={(selected) => {
                  const newState = selected?.value || '';
                  setFilterState(newState);
                  updateLgas(newState);
                  if (!newState) {
                    setFilterLga('');
                    setFilterWard('');
                    setLgas([]);
                    setWards([]);
                  }
                  if (searchTerm) handleSearch(searchTerm);
                }}
                value={states.find((option) => option.value === filterState) || null}
                placeholder="Select a state"
                isClearable
                styles={customSelectStyles}
                className="text-sm sm:text-base font-medium"
                aria-label="Select state"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lga-filter"
                className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider"
              >
                LGA
              </Label>
              <Select
                inputId="lga-filter"
                options={lgas}
                onChange={(selected) => {
                  const newLga = selected?.value || '';
                  setFilterLga(newLga);
                  updateWards(filterState, newLga);
                  if (!newLga) {
                    setFilterWard('');
                    setWards([]);
                  }
                  if (searchTerm) handleSearch(searchTerm);
                }}
                value={lgas.find((option) => option.value === filterLga) || null}
                placeholder="Select an LGA"
                isClearable
                isDisabled={!filterState}
                styles={customSelectStyles}
                className="text-sm sm:text-base font-medium"
                aria-label="Select LGA"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="ward-filter"
                className="text-xs sm:text-sm font-semibold text-[#225F91] uppercase tracking-wider"
              >
                Ward
              </Label>
              <Select
                inputId="ward-filter"
                options={wards}
                onChange={(selected) => {
                  setFilterWard(selected?.value || '');
                  if (searchTerm) handleSearch(searchTerm);
                }}
                value={wards.find((option) => option.value === filterWard) || null}
                placeholder="Select a ward"
                isClearable
                isDisabled={!filterLga}
                styles={customSelectStyles}
                className="text-sm sm:text-base font-medium"
                aria-label="Select ward"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-9 px-6 text-sm sm:text-base font-semibold rounded-full border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 transition-all duration-300"
                aria-label="Clear all filters"
              >
                Clear
              </Button>
              {activeFilters > 0 && (
                <Button
                  variant="outline"
                  onClick={saveCurrentFilter}
                  className="h-9 px-6 text-sm sm:text-base font-semibold rounded-full border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 transition-all duration-300"
                  aria-label="Save current filter"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Filter
                </Button>
              )}
            </div>
            <Button
              onClick={() => handleSearch(searchTerm)}
              className="h-9 px-6 text-sm sm:text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.6)] transition-all duration-300"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;