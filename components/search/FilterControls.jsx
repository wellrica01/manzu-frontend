import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import Select from 'react-select';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: `1px solid ${state.isFocused ? 'rgba(26,186,127,0.5)' : 'rgba(26,186,127,0.3)'}`,
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
    border: '1px solid rgba(26,186,127,0.3)',
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
  filterHomeCollection,
  setFilterHomeCollection,
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
  serviceType,
}) => {
  const isMedication = serviceType === 'medication';
  const providerType = isMedication ? 'pharmacies' : 'labs';

  return (
    <Card
      className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardContent
        id="filter-content"
        className="p-4 sm:p-6 space-y-6 bg-transparent animate-in slide-in-from-top duration-500"
      >
        <p className="text-base font-medium text-gray-600 tracking-wide">
          Tailor your search to find the best {providerType}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="state-filter"
              className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
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
              className="text-base"
              aria-label="Select state"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="lga-filter"
              className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
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
              className="text-base"
              aria-label="Select LGA"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="ward-filter"
              className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
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
              className="text-base"
              aria-label="Select ward"
            />
          </div>
          {!isMedication && (
            <div className="space-y-2">
              <Label
                htmlFor="home-collection-filter"
                className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
              >
                Home Collection
              </Label>
              <Select
                inputId="home-collection-filter"
                options={[
                  { value: 'true', label: 'Home Collection Available' },
                  { value: '', label: 'All Labs' },
                ]}
                onChange={(selected) => {
                  setFilterHomeCollection(selected?.value === 'true' || false);
                  if (searchTerm) handleSearch(searchTerm);
                }}
                value={
                  filterHomeCollection
                    ? { value: 'true', label: 'Home Collection Available' }
                    : { value: '', label: 'All Labs' }
                }
                styles={customSelectStyles}
                className="text-base"
                aria-label="Select home collection preference"
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label
            className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
          >
            Sort By
          </Label>
          <div className="flex gap-4 pt-2">
            {[
              { value: 'cheapest', label: 'Cheapest', icon: ArrowDown },
              { value: 'closest', label: 'Closest', icon: MapPin },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={sortBy === value ? 'default' : 'outline'}
                onClick={() => {
                  setSortBy(value);
                  if (searchTerm) handleSearch(searchTerm);
                }}
                className={cn(
                  'h-10 px-6 text-base font-semibold rounded-full transition-all duration-300',
                  sortBy === value
                    ? 'bg-[#225F91] text-white shadow-[0_0_15px_rgba(34,95,145,0.5)]'
                    : 'border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50'
                )}
                aria-label={`Sort by ${value}`}
              >
                <Icon className="h-5 w-5 mr-2" aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F] text-[#225F91] hover:bg-red-100/50 hover:border-red-500/50 hover:text-red-600 transition-all duration-300"
            aria-label="Clear all filters"
          >
            Clear Filters
          </Button>
          <Button
            onClick={() => handleSearch(searchTerm)}
            className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.6)] transition-all duration-300"
          >
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterControls;