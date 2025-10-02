'use client';

const SearchSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    <div className="h-12 sm:h-16 bg-gray-200 rounded-lg sm:rounded-2xl"></div>
    <div className="h-24 sm:h-32 bg-gray-200 rounded-lg sm:rounded-2xl"></div>
    <div className="space-y-3 sm:space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 sm:h-48 bg-gray-200 rounded-lg sm:rounded-2xl"
        ></div>
      ))}
    </div>
  </div>
);

export default SearchSkeleton;
