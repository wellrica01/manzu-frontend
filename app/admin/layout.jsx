import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import AdminSideNav from '@/components/AdminSideNav'
export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white shadow-md">
        <AdminSideNav />
      </div>
      {/* Mobile Drawer */}
      <div className="md:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="m-4">
              Menu
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-64">
            <AdminSideNav />
          </DrawerContent>
        </Drawer>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}