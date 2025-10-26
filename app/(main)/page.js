import { Suspense } from 'react';
import HomePage from './HomePage';

export const metadata = {
  title: 'Manzu - Your Trusted Healthcare Platform',
  description: "Instantly discover which nearby pharmacies have your medications in stock, compare prices, and order for delivery across Nigeria's 774 LGAs.",
  keywords: "pharmacy Nigeria, medication search, find medicine, NAFDAC approved, online pharmacy Nigeria",
  openGraph: {
    title: 'Manzu - Find Your Medications Instantly',
    description: "Nigeria's first medication discovery platform. Compare prices and find available medications near you.",
    url: 'https://manzu.com',
    type: "website",
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Homepage' }],
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading homepage...</div>}>
      <HomePage />
    </Suspense>
  );
}
