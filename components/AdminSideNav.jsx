'use client';
import Link from 'next/link';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useRouter } from 'next/navigation';

export default function AdminSideNav() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear JWT token
    router.push('/admin/login'); // Redirect to login page
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Pharmacies', href: '/admin/pharmacies' },
    { name: 'Medications', href: '/admin/medications' },
    { name: 'Prescriptions', href: '/admin/prescriptions' },
    { name: 'Orders', href: '/admin/orders' },
    { name: 'Pharmacy Users', href: '/admin/pharmacy-users' },
    { name: 'Admin Users', href: '/admin/admin-users' },

  ];

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <nav className="flex-1">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <Button variant="ghost" className="w-full justify-start mb-2">
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
      <Separator className="my-4" />
      <Button variant="destructive" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}