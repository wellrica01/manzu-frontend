import './globals.css';
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
export const metadata = {
  title: 'New Medication App',
  description: 'Digital pharmacy platform',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="bg-indigo-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              Manzu
            </Link>
            <div className="space-x-4">
              <Link href="/" className="hover:text-indigo-200">
                Home
              </Link>
              <Link href="/cart" className="hover:text-indigo-200">
                Cart
              </Link>
              <Link href="/track" className="hover:text-indigo-200">
                Track Order
              </Link>
              <Link href="/pharmacy/dashboard">
                Pharmacy Dashboard
            </Link>
              <Link href="/pharmacy/register">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Register Pharmacy
        </Button>
      </Link>
      <Link href="/pharmacy/login">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Pharmacy Login
        </Button>
      </Link>
            </div>
          </div>
        </nav>
        {children}
        <Toaster />
      </body>
    </html>
  );
}