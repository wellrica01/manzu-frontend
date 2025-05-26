import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import AdminSideNav from '@/components/AdminSideNav';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-card shadow-lg fade-in">
        <AdminSideNav />
      </aside>
      {/* Mobile Drawer */}
      <div className="md:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="m-4 border-primary text-primary hover:bg-primary/10">
              <Menu className="h-5 w-5 mr-2" />
              Menu
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-64 bg-card shadow-lg">
            <AdminSideNav />
          </DrawerContent>
        </Drawer>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}