import React from 'react';

export default function Topbar() {
  // You can fetch admin info from context or props
  return (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-white/80 border-b border-[#1ABA7F]/10 shadow-sm">
      <div className="text-lg font-semibold text-[#225F91]">Admin Panel</div>
      <div className="flex items-center gap-4">
        {/* Replace with actual admin info */}
        <span className="text-[#1ABA7F] font-medium">Admin Name</span>
        {/* Add avatar or dropdown if needed */}
      </div>
    </header>
  );
} 