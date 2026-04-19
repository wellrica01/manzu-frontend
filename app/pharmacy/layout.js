export const metadata = {
  title: "Manzu Pharmacy Portal",
  description:
    "Manage inventory, orders, prescriptions, and pharmacy operations on Manzu Pharmacy Portal.",
  openGraph: {
    title: "Manzu Pharmacy Portal",
    description:
      "Pharmacy management system for verified partners on Manzu.",
    url: "https://pharmacy.manzu.ng",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PharmacyLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* You can later add pharmacy sidebar/header here */}

      <main className="w-full">
        {children}
      </main>
    </div>
  );
}