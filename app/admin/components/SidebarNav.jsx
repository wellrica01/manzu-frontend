'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Home, Users, ShoppingBag, FileText, Package, LogOut, BookOpen, Layers, FlaskConical, 
  ListOrdered, Factory, Info, Heart, Pill, FlaskRound, List, BookIcon, ChevronLeft,
  Menu, X, Bell, Search, User, Settings, ChevronDown, ChevronUp
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/medications/brand', label: 'Medications', icon: ShoppingBag },
  { href: '/admin/medications/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/admin/pharmacies', label: 'Pharmacies', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ListOrdered },
  { href: '/admin/users', label: 'Users', icon: Users },
];

const masterDataItems = [
  { href: '/admin/medications/active-substances', label: 'Active Product Ingredients', icon: BookOpen },
  { href: '/admin/medications/medication-ingredients', label: 'Medication Ingredients', icon: BookIcon },
  { href: '/admin/medications/generic-names', label: 'Generic Names', icon: Layers },
  { href: '/admin/medications/chemical-substances', label: 'Chemical Substances', icon: List },
  { href: '/admin/medications/chemical-classes', label: 'Chemical Groups', icon: FlaskRound },
  { href: '/admin/medications/pharmacological-classes', label: 'Pharmacological Groups', icon: Pill },
  { href: '/admin/medications/therapeutic-classes', label: 'Therapeutic Groups', icon: FlaskConical },
  { href: '/admin/medications/anatomical-classes', label: 'Anatomical Groups', icon: Heart },
  { href: '/admin/medications/indications', label: 'Indications', icon: Info },
  { href: '/admin/medications/manufacturers', label: 'Manufacturers', icon: Factory },
];

export default function SidebarNav({ isCollapsed, onToggle, isMobile, isOpen, onClose }) {
  const pathname = usePathname();
  const [masterDataOpen, setMasterDataOpen] = useState(false);

  // Auto-collapse master data when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) {
      setMasterDataOpen(false);
    }
  }, [isCollapsed]);

  // Check if any master data item is active
  const isMasterDataActive = masterDataItems.some(item => pathname.startsWith(item.href));

  // Auto-expand master data if a master data item is active
  useEffect(() => {
    if (isMasterDataActive && !isCollapsed) {
      setMasterDataOpen(true);
    }
  }, [pathname, isMasterDataActive, isCollapsed]);

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
                Manzu Admin
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
            >
              <ChevronLeft className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {/* Main navigation items */}
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              onClick={isMobile ? onClose : undefined}
            />
          ))}

          {/* Master Data Section */}
          {!isCollapsed && (
            <div className="pt-6">
              <button
                onClick={() => setMasterDataOpen(!masterDataOpen)}
                className={`flex items-center justify-between w-full px-2 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors ${
                  isMasterDataActive ? 'text-[#1ABA7F]' : ''
                }`}
              >
                <span>Master Data</span>
                {masterDataOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
             <div className={`space-y-1 mt-2 transition-all duration-300 ${
                masterDataOpen ? 'max-h-[calc(100vh-12rem)] overflow-y-auto opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                {masterDataItems.map((item) => (
                  <NavItem key={item.href} {...item} onClick={isMobile ? onClose : undefined} />
                ))}
              </div>

            </div>
          )}

          {/* Collapsed master data items */}
          {isCollapsed && masterDataItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/60">
          <button
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-gradient-to-r from-[#225F91] to-[#1A4971] text-white font-semibold hover:from-[#1A4971] hover:to-[#225F91] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}