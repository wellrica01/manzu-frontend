import SidebarNav from './components/SidebarNav';
import Topbar from './components/Topbar';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-white to-[#225F91]/5">
      <SidebarNav />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
