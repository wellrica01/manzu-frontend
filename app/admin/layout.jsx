'use client';
import { useState, useEffect } from 'react';
import SidebarNav from './components/SidebarNav';
import Topbar from './components/Topbar';

export default function AdminLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false); // Don't collapse on mobile
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved && !isMobile) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, [isMobile]);

  // Save collapsed state to localStorage
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed, isMobile]);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SidebarNav
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar 
          onSidebarToggle={handleSidebarToggle}
          isMobile={isMobile}
        />
        <main className={`flex-1 p-2 sm:p-6 lg:p-8 transition-all duration-300 ${
          !isMobile && sidebarCollapsed ? 'ml-0' : ''
        }`}>
          <div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}