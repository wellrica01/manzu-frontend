'use client';
import MedicationCard from "./MedicationCard";
import SearchSkeleton from "./SearchSkeleton";

export default function SearchResults({ results, isSearching, searchTerm, error, handleAddToCart, isInCart, isAddingToCart, t }) {
  if (isSearching) return <SearchSkeleton />;

  if (error) {
    return (
      <div className="text-center py-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (results.length === 0 && searchTerm) {
    return (
      <div className="text-center py-8 bg-white/95 border border-[#1ABA7F]/20 rounded-xl shadow-md">
        <p className="text-gray-600 text-sm">
          {t("search.no_results", { searchTerm })}
        </p>
      </div>
    );
  }

  if (results.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-8 bg-white/95 border border-[#1ABA7F]/20 rounded-xl shadow-md">
        <p className="text-gray-600 text-sm">{t("search.enter_medication")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((med) => (
        <MedicationCard
          key={med.id}
          med={med}
          handleAddToCart={handleAddToCart}
          isInCart={isInCart}
          isAddingToCart={isAddingToCart}
        />
      ))}
    </div>
  );
}
