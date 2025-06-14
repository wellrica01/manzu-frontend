// app/(main)/page.js
import HomePage from './HomePage';

export const metadata = {
  title: 'Manzu - Discover Medications',
  description: 'Find medications nearby or upload your prescription with Manzu.',
  openGraph: {
    title: 'Manzu - Discover Medications',
    description: 'Find medications nearby or upload your prescription with Manzu.',
    url: 'https://manzu.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Homepage' }],
  },
};

export default function Page() {
  return <HomePage />;
}
