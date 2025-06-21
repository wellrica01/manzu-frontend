import HomePage from './HomePage';

export const metadata = {
  title: 'Manzu - Your Trusted Healthcare Platform',
  description: 'Access medications and diagnostic tests across Nigeria with Manzu.',
  openGraph: {
    title: 'Manzu - Your Trusted Healthcare Platform',
    description: 'Access medications and diagnostic tests across Nigeria with Manzu.',
    url: 'https://manzu.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Homepage' }],
  },
};

export default function Page() {
  return <HomePage />;
}