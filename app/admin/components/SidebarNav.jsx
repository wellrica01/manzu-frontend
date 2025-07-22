'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ShoppingBag, FileText, Package, LogOut, BookOpen, Layers, FlaskConical, ListOrdered, Factory, Info } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/pharmacies', label: 'Pharmacies', icon: Package },
  { href: '/admin/medications', label: 'Medications', icon: ShoppingBag },
  { href: '/admin/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/admin/orders', label: 'Orders', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
];

const masterDataItems = [
  { href: '/admin/generic-medications', label: 'Generic Medications', icon: BookOpen },
  { href: '/admin/categories', label: 'Categories', icon: Layers },
  { href: '/admin/therapeutic-classes', label: 'Therapeutic Classes', icon: FlaskConical },
  { href: '/admin/chemical-classes', label: 'Chemical Classes', icon: ListOrdered },
  { href: '/admin/indications', label: 'Indications', icon: Info },
  { href: '/admin/manufacturers', label: 'Manufacturers', icon: Factory },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-white to-[#225F91]/5 border-r border-[#1ABA7F]/20 flex flex-col">
      <div className="px-6 py-8 flex items-center gap-2">
        <span className="text-2xl font-bold text-[#225F91] tracking-tight">Manzu Admin</span>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-[#1ABA7F]/20 text-[#225F91]'
                : 'text-gray-700 hover:bg-[#1ABA7F]/10 hover:text-[#1ABA7F]'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        <div className="mt-6 mb-2 text-xs font-bold text-gray-400 px-2 uppercase tracking-widest">Master Data</div>
        {masterDataItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-[#1ABA7F]/20 text-[#225F91]'
                : 'text-gray-700 hover:bg-[#1ABA7F]/10 hover:text-[#1ABA7F]'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-6 mt-auto">
        <button
          className="flex items-center gap-2 px-4 py-2 w-full rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition"
          // onClick={logoutFunction}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
} 