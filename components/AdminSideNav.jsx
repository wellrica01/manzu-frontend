'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Pill,
  FileText,
  ShoppingBag,
  Users,
  UserCog,
  LogOut,
} from 'lucide-react';

export default function AdminSideNav() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear JWT token
    router.push('/admin/login'); // Redirect to login page
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Pharmacies', href: '/admin/pharmacies', icon: Store },
    { name: 'Medications', href: '/admin/medications', icon: Pill },
    { name: 'Prescriptions', href: '/admin/prescriptions', icon: FileText },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Pharmacy Users', href: '/admin/pharmacy-users', icon: Users },
    { name: 'Admin Users', href: '/admin/admin-users', icon: UserCog },
  ];

  return (
    <div className="flex flex-col h-full p-6 bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-lg border-r border-gray-100/20 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-8 tracking-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 hover:animate-pulse">
          Admin Panel
        </span>
      </h2>
      <nav className="flex-1 space-y-2">
        {navItems.map((item, index) => (
          <Link key={item.name} href={item.href}>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 text-base font-semibold hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] rounded-full transition-all duration-300 animate-in fade-in-20"
              style={{ animationDelay: `${0.1 * index}s` }}
              aria-label={`Navigate to ${item.name}`}
            >
              <item.icon className="h-6 w-6 mr-3 text-primary/90" aria-hidden="true" />
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
      <Separator className="my-6 bg-gray-100/30" />
      <Button
        variant="destructive"
        className="h-12 px-6 text-sm font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5 mr-2" aria-hidden="true" />
        Logout
      </Button>
    </div>
  );
}