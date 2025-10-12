'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Home, Package, ClipboardList, BarChart2, User, LogOut, 
  ChevronLeft, X, Pill, Receipt, CreditCard
} from 'lucide-react';

const navItems = [
  { href: '/pharmacy/dashboard', label: 'Dashboard', icon: Home },
  { href: '/pharmacy/pos/new-sale', label: 'Point of Sale', icon: CreditCard },
  { href: '/pharmacy/inventory', label: 'Inventory', icon: Package },
  { href: '/pharmacy/orders', label: 'Orders', icon: ClipboardList },
  { href: '/pharmacy/pos/sales-history/', label: 'Sales History', icon: Package },
  { href: '/pharmacy/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/pharmacy/profile', label: 'Profile', icon: User },
];

export default function SidebarNav({ isCollapsed, onToggle, isMobile, isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    router.push('/pharmacy/login');
  };

  const NavItem = ({ href, label, icon: Icon, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative ${
        pathname.startsWith(href)
          ? 'bg-gradient-to-r from-[#1ABA7F]/20 to-[#1ABA7F]/10 text-[#225F91] shadow-sm border-l-4 border-[#1ABA7F]'
          : 'text-gray-600 hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent hover:text-[#1ABA7F] hover:shadow-sm'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={`flex-shrink-0 transition-all duration-200 ${
        pathname.startsWith(href) ? 'w-5 h-5 text-[#1ABA7F]' : 'w-5 h-5 group-hover:scale-110'
      }`} />
      {!isCollapsed && (
        <span className="truncate transition-opacity duration-200">{label}</span>
      )}
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </Link>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobile 
          ? `fixed left-0 top-0 z-50 h-full bg-white transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative bg-white/95 backdrop-blur-sm'
        }
        ${isCollapsed && !isMobile ? 'w-20' : 'w-64'}
        min-h-screen border-r border-gray-200/60 flex flex-col shadow-lg transition-all duration-300 ease-in-out
      `}>
        
        {/* Header */}
        <div className={`px-6 py-6 flex items-center border-b border-gray-200/60 ${isCollapsed && !isMobile ? 'justify-center px-4' : 'justify-between'}`}>
          {!isCollapsed || isMobile ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
                Manzu Pharmacy
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-lg flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
          
          {/* Desktop toggle button */}
          {!isMobile && (
            <button
              onClick={onToggle}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ${isCollapsed ? 'absolute -right-3 top-6 bg-white shadow-md border' : ''}`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/60">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-gradient-to-r from-[#225F91] to-[#1A4971] text-white font-semibold hover:from-[#1A4971] hover:to-[#225F91] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
          
          {!isCollapsed && (
            <p className="text-xs text-gray-400 text-center mt-3">
              © 2024 Manzu Pharmacy
            </p>
          )}
        </div>
      </aside>
    </>
  );
}