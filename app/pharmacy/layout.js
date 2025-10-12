'use client';

import { useState, useEffect } from 'react';
import SidebarNav from './dashboard/components/SidebarNav';
import Topbar from './dashboard/components/Topbar';
import { Toaster } from '@/components/ui/sonner';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function PharmacyLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setSidebarCollapsed(false);
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 flex flex-row">
      <SidebarNav 
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar 
          onSidebarToggle={toggleSidebar}
          isMobile={isMobile}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full" role="main" aria-label="Pharmacy dashboard content">
          <Suspense
            fallback={
              <div className="text-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-[#1ABA7F] mx-auto" aria-hidden="true" />
                <p className="text-gray-600 text-lg font-medium mt-4">Loading content...</p>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
        
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              color: 'var(--card-foreground)',
              border: '1px solid rgba(209, 213, 219, 0.3)',
              borderRadius: '1rem',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
              padding: '1.25rem',
              backdropFilter: 'blur(8px)',
            },
          }}
        />
      </div>
    </div>
  );
}