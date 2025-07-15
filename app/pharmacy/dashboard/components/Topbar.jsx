'use client';
import { Bell, User } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Topbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarRef = useRef(null);

  return (
    <header className="w-full bg-white/90 border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="text-xl font-bold text-primary tracking-tight">Manzu Pharmacy</div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-primary/10 focus:outline-none" aria-label="Notifications">
          <Bell className="w-6 h-6 text-primary" />
        </button>
        <div className="relative" ref={avatarRef}>
          <button
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold focus:outline-none"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-label="User menu"
          >
            <User className="w-6 h-6" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 animate-in slide-in-from-top-2 duration-200">
              <a href="/pharmacy/profile" className="block px-4 py-2 text-gray-700 hover:bg-primary/10">Profile</a>
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-primary/10">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 