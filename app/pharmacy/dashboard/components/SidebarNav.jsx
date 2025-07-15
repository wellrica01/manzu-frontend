'use client';
import { Home, Package, ClipboardList, BarChart2, User, Menu, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/pharmacy/dashboard', icon: Home },
  { label: 'Inventory', href: '/pharmacy/inventory', icon: Package },
  { label: 'Orders', href: '/pharmacy/orders', icon: ClipboardList },
  { label: 'Analytics', href: '/pharmacy/analytics', icon: BarChart2 },
  { label: 'Profile', href: '/pharmacy/profile', icon: User },
];

export default function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    router.push('/pharmacy/login');
  };

  return (
    <aside className={`h-screen sticky top-0 left-0 z-40 bg-white border-r border-gray-200 shadow-lg flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      aria-label="Sidebar navigation"
    >
      <div className="flex items-center justify-between px-4 py-6">
        <span className={`text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 ${collapsed ? 'hidden' : ''}`}>Manzu</span>
        <button
          className="p-2 rounded hover:bg-gray-100 focus:outline-none"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-2 mt-4">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} legacyBehavior>
            <a className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-primary/10 transition-colors duration-200 group">
              <Icon className="w-6 h-6 text-primary" />
              <span className={`${collapsed ? 'hidden' : 'inline'}`}>{label}</span>
            </a>
          </Link>
        ))}
      </nav>
      <div className="flex-0 px-4 py-6 mt-auto text-xs text-gray-400 text-center flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors duration-200"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
          <span className={`${collapsed ? 'hidden' : 'inline'}`}>Logout</span>
        </button>
        {collapsed ? '©' : '© 2024 Manzu Pharmacy'}
      </div>
    </aside>
  );
} 