import TestLayout from '@/components/lab/TestLayout';

export const metadata = {
  title: 'Manzu - Test Services',
  description: 'Book lab tests and imaging services or upload test orders with Manzu.',
  openGraph: {
    title: 'Manzu - Test Services',
    description: 'Book lab tests and imaging services or upload test orders with Manzu.',
    url: 'https://manzu.com/test',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Test Services' }],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function Layout({ children }) {
  return <TestLayout>{children}</TestLayout>;
}