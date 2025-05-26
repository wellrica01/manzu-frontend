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
    <div className="flex flex-col h-full p-4 bg-card">
      <h2 className="text-2xl font-bold text-primary mb-6">Admin Panel</h2>
      <nav className="flex-1 space-y-1">
        {navItems.map((item, index) => (
          <Link key={item.name} href={item.href}>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-primary/10 transition-colors duration-200 fade-in"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <item.icon className="h-5 w-5 mr-3 text-primary" />
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
      <Separator className="my-4 bg-border" />
      <Button
        variant="destructive"
        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Logout
      </Button>
    </div>
  );
}