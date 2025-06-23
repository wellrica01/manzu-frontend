import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Select from 'react-select';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: `1px solid ${state.isFocused ? 'rgba(26,186,127,0.5)' : 'rgba(209,213,219,0.5)'}`,
    boxShadow: state.isFocused ? '0 0 10px rgba(26,186,127,0.3)' : 'none',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '1rem',
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
    border: '1px solid rgba(209,213,219,0.5)',
    borderRadius: '1rem',
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
  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <div
        className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent cursor-pointer hover:bg-[#1ABA7F]/20 transition-colors duration-300"
        onClick={() => setShowFilters(!showFilters)}
        role="button"
        aria-expanded={showFilters}
        aria-controls="filter-content"
      >
        <div className="flex items-center gap-3">
          <Filter className="h-6 w-6 text-[#225F91] transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-bold text-[#225F91] tracking-tight">
            {showFilters ? 'Hide Filters' : 'Refine Your Search'}
          </span>
        </div>
        {(filterState || filterLga || filterWard || sortBy !== 'cheapest') && (
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
      {showFilters && (
        <CardContent id="filter-content" className="px-6 sm:px-8 py-6 space-y-6 bg-transparent animate-in slide-in-from-top duration-500">
          <p className="text-base font-medium text-gray-600 tracking-wide">
            Tailor your search to find the best labs
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="state-filter" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
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
                className="text-base"
                aria-label="Select state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lga-filter" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
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
                className="text-base"
                aria-label="Select LGA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ward-filter" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
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
                className="text-base"
                aria-label="Select ward"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
              Sort By
            </Label>
            <div className="flex gap-4 pt-2">
              {['cheapest', 'closest'].map((value) => (
                <Button
                  key={value}
                  variant={sortBy === value ? 'default' : 'outline'}
                  onClick={() => {
                    setSortBy(value);
                    if (searchTerm) handleSearch(searchTerm);
                  }}
                  className={cn(
                    'h-10 px-6 text-sm font-semibold rounded-full transition-all duration-300',
                    sortBy === value
                      ? 'bg-[#225F91] text-white shadow-[0_0_15px_rgba(34,95,145,0.5)]'
                      : 'border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50'
                  )}
                  aria-label={`Sort by ${value}`}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="h-12 px-6 text-sm font-semibold rounded-full border-[#1ABA7F]/20 text-[#225F91] hover:bg-red-100/50 hover:border-red-500/50 hover:text-red-600 transition-all duration-300"
              aria-label="Clear all filters"
            >
              Clear
            </Button>
            <Button
              onClick={() => handleSearch(searchTerm)}
              className="h-12 px-6 text-sm font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.6)] animate-pulse transition-all duration-300"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default FilterControls;