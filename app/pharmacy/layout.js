import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Manzu - Pharmacy Portal',
  description: 'Manage your pharmacy with Manzu’s professional tools.',
};

export default function PharmacyLayout({ children }) {
  return (
    <>
        <main className="min-h-screen flex items-center justify-center p-4">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              padding: '1rem',
            },
          }}
        />
    </>
  );
}