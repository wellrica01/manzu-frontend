'use client';
import { Button } from "@/components/ui/button";
import { History, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchDropdown({
  suggestions,
  history,
  clearHistory,
  onSelectSuggestion,
  onSelectHistory,
  showHistory = true,
  isLoading = false,
  focusedIndex = -1,
  suggestionRefs,
}) {
  if ((!suggestions?.length && !history?.length) && !isLoading) return null;

  return (
    <div
      className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-64 overflow-y-auto"
    >
      <div className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-lg shadow-lg">
        
        {/* History */}
        {showHistory && history?.length > 0 && (
          <div>
            <div className="p-2 border-b border-[#1ABA7F]/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#225F91] text-sm font-medium">
                <History className="h-4 w-4" />
                Recent Searches
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                aria-label="Clear search history"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {history.map((term, i) => (
              <button
                key={i}
                onClick={() => onSelectHistory(term)}
                className="w-full px-4 py-2 text-left hover:bg-[#1ABA7F]/10 flex items-center gap-2 text-sm"
              >
                <History className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{term}</span>
              </button>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions?.length > 0 && (
          <div>
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                ref={(el) => (suggestionRefs.current[i] = el)}
                onClick={() => onSelectSuggestion(s)}
                className={cn(
                  "w-full px-4 py-2 text-left flex items-center gap-3 text-sm transition-colors",
                  focusedIndex === i
                    ? "bg-[#1ABA7F]/10 text-[#225F91]"
                    : "hover:bg-[#1ABA7F]/10 text-gray-700"
                )}
                role="option"
                aria-selected={focusedIndex === i}
              >
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.displayName}
                    className="w-8 h-8 object-cover rounded-sm border border-[#1ABA7F]/20"
                  />
                ) : (
                  <TrendingUp className="h-4 w-4 text-[#225F91]" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{s.displayName}</div>
                  <div className="text-gray-500 text-xs">{s.genericName}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="p-3 flex items-center gap-2 text-xs text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1ABA7F]" />
            Searching...
          </div>
        )}
      </div>
    </div>
  );
}
