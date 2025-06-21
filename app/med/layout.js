import MedLayout from '@/components/MedLayout';

export const metadata = {
  title: 'Manzu - Medication Services',
  description: 'Find and order medications or upload prescriptions with Manzu.',
  openGraph: {
    title: 'Manzu - Medication Services',
    description: 'Find and order medications or upload prescriptions with Manzu.',
    url: 'https://manzu.com/med',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Medication Services' }],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function Layout({ children }) {
  return <MedLayout>{children}</MedLayout>;
}