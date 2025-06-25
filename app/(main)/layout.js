import MainLayout from '@/components/MainLayout';

export const metadata = {
  title: 'Manzu - Trusted Healthcare for Every Nigerian',
  description: 'Discover medications and book diagnostic tests with ease.',
  openGraph: {
    title: 'Manzu',
    description: 'Discover medications and book diagnostic tests with ease.',
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