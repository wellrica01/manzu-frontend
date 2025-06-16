import MainLayout from '@/components/MainLayout';

// Default export for metadata
export const metadata = {
  title: 'Manzu - Trusted Medication Access for Every Nigerian',
  description: 'Discover medications and manage prescriptions with ease.',
  openGraph: {
    title: 'Manzu',
    description: 'Discover medications and manage prescriptions with ease.',
    url: 'https://manzu.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Platform' }],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function Layout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}