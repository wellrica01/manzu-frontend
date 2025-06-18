import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import AdminSideNav from '@/components/AdminSideNav';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-lg border-r border-gray-100/20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] sticky top-0 h-screen animate-in slide-in-from-left-20 duration-500">
        <AdminSideNav />
      </aside>
      {/* Mobile Drawer */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="h-12 px-4 rounded-full border-gray-200/50 text-primary hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-300"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 mr-2" aria-hidden="true" />
              Menu
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-72 bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-lg border-r border-gray-100/20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-left-20 duration-300">
            <AdminSideNav />
          </DrawerContent>
        </Drawer>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 lg:p-12 max-w-7xl mx-auto" role="main" aria-label="Admin dashboard content">
        <div className="animate-in fade-in-20 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}