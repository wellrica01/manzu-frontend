'use client';
import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, Settings, ChevronDown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PENDING_STATUS = 'CONFIRMED'; // backend uses CONFIRMED for "not yet processed"

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Topbar({ onSidebarToggle, isMobile }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    router.push('/pharmacy-login');
  };

  // Fetch the count + first few pending orders whenever the component mounts.
  // The web portal doesn't use React Query, so this is the same pattern as PayoutSummaryWidget.
  useEffect(() => {
    let cancelled = false;
    async function fetchPendingOrders() {
      try {
        const token = localStorage.getItem('pharmacyToken');
        if (!token) return;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders?status=${PENDING_STATUS}&limit=3`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setPendingOrders(data.orders ?? []);
        setPendingTotal(data.pagination?.total ?? 0);
      } catch (error) {
        console.error('Failed to fetch pending orders:', error);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }
    fetchPendingOrders();
    // Re-check every 60s so the badge stays reasonably fresh.
    const interval = setInterval(fetchPendingOrders, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close notifications on outside click.
  useEffect(() => {
    if (!showNotifications) return;
    const close = () => setShowNotifications(false);
    // Delay to avoid the same click that opened it from closing it.
    const timer = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [showNotifications]);

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
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={pendingTotal > 0 ? `${pendingTotal} pending orders` : 'Notifications'}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {pendingTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-semibold text-white">
                {pendingTotal > 9 ? '9+' : pendingTotal}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {pendingTotal > 0 && (
                  <span className="text-xs text-gray-500">
                    {pendingTotal} pending order{pendingTotal !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="p-6 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">No pending orders</p>
                    <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up</p>
                  </div>
                ) : (
                  pendingOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => {
                        setShowNotifications(false);
                        router.push(`/pharmacy/(dashboard)/orders?order=${order.id}`);
                      }}
                      className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order.id} needs processing
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.name || 'Customer'} · ₦{(order.totalPrice ?? 0).toLocaleString()} · {formatRelativeTime(order.createdAt)}
                      </p>
                    </button>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    router.push(`/pharmacy/(dashboard)/orders?status=${PENDING_STATUS}`);
                  }}
                  className="text-sm text-[#1ABA7F] hover:text-[#159e6a] font-medium"
                >
                  View all pending orders
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
    </header>
  );
}