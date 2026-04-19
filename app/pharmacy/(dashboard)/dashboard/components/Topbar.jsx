'use client';
import React, { useState } from 'react';
import { Menu, Bell, User, Settings, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Topbar({ onSidebarToggle, isMobile }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    router.push('/pharmacy-login');
  };

  // On mobile, render only the sidebar toggle
if (isMobile) {
  return (
    <div className="sticky top-0 z-30 p-3 pointer-events-none">
      <button
        onClick={onSidebarToggle}
        className="p-2 bg-white/80 backdrop-blur-sm shadow-sm rounded-lg hover:bg-white transition-colors pointer-events-auto"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}

  // Desktop: full topbar
  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">Pharmacy Portal</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-4 hover:bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">New order received</p>
                  <p className="text-xs text-gray-500 mt-1">Order #1234 needs processing</p>
                </div>
                <div className="p-4 hover:bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Low stock alert</p>
                  <p className="text-xs text-gray-500 mt-1">Paracetamol inventory running low</p>
                </div>
                <div className="p-4 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">Restock reminder</p>
                  <p className="text-xs text-gray-500 mt-1">5 items need restocking this week</p>
                </div>
              </div>
              <div className="p-3 border-t border-gray-200">
                <button className="text-sm text-[#1ABA7F] hover:text-[#159e6a] font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Pharmacy User</p>
              <p className="text-xs text-gray-500">Pharmacist</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Profile</span>
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Settings</span>
                </button>
                <hr className="my-2 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors text-red-600"
                >
                  <span className="text-sm">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProfileMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      )}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </header>
  );
}