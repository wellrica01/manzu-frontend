'use client';

export default function SearchSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-200 rounded-lg" />
      <div className="h-24 bg-gray-200 rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
