import { Card, CardContent, CardHeader } from '@/components/ui/card';


export default function PrivacyPolicy() {
return (
  <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
        Privacy Policy
      </h1>
      <p className="text-base text-gray-600 mb-6 text-center font-medium animate-in slide-in-from-top-10 duration-700" style={{ animationDelay: '0.1s' }}>
        Last updated: June 9, 2025
      </p>

      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] mb-6 animate-in fade-in-20"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="bg-primary/10 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary">Introduction</h2>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <p className="text-base text-gray-600 font-medium leading-relaxed">
            Manzu, operated by Wellrica, is committed to protecting your privacy in compliance with Nigeria’s Data Protection Regulation (NDPR). This Privacy Policy explains how we collect, use, store, and protect your personal data.
          </p>
        </CardContent>
      </Card>

      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] mb-6 animate-in fade-in-20"
        style={{ animationDelay: '0.3s' }}
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="bg-primary/10 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary">Data We Collect</h2>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <ul className="list-disc pl-6 text-base text-gray-600 font-medium leading-relaxed space-y-2">
            <li>Contact Information: Email and phone number (optional) for order processing and notifications.</li>
            <li>Location Data: Address and geolocation for finding nearby pharmacies.</li>
            <li>Health Data: Prescription files and medication details for order fulfillment.</li>
            <li>Payment Data: Processed securely via Paystack; we do not store payment details.</li>
            <li>Usage Data: Browsing activity to improve our services.</li>
          </ul>
        </CardContent>
      </Card>

      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] mb-6 animate-in fade-in-20"
        style={{ animationDelay: '0.4s' }}
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="bg-primary/10 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary">How We Use Your Data</h2>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <ul className="list-disc pl-6 text-base text-gray-600 font-medium leading-relaxed space-y-2">
            <li>Process and fulfill medication orders.</li>
            <li>Communicate order updates via email or SMS.</li>
            <li>Locate nearby pharmacies for delivery or pickup.</li>
            <li>Comply with legal obligations (e.g., NDPR, PCN, NAFDAC).</li>
            <li>Improve our platform’s functionality.</li>
          </ul>
        </CardContent>
      </Card>

      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] mb-6 animate-in fade-in-20"
        style={{ animationDelay: '0.5s' }}
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="bg-primary/10 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary">Data Storage and Security</h2>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <p className="text-base text-gray-600 font-medium leading-relaxed">
            We store your data securely using encryption and access controls. Prescription files are stored with encryption. Data is retained only as long as necessary for order fulfillment or legal compliance.
          </p>
        </CardContent>
      </Card>

      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] mb-6 animate-in fade-in-20"
        style={{ animationDelay: '0.6s' }}
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="bg-primary/10 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary">Your Rights</h2>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <p className="text-base text-gray-600 font-medium leading-relaxed mb-2">
            Under NDPR, you have the right to:
          </p>
          <ul className="list-disc pl-6 text-base text-gray-600 font-medium leading-relaxed space-y-2">
            <li>Access your personal data.</li>
            <li>Request corrections or deletions.</li>
            <li>Withdraw consent at any time.</li>
            <li>File complaints with the Nigeria Data Protection Commission.</li>
          </ul>
          <p className="text-base text-gray-600 font-medium leading-relaxed mt-4">
            Contact us at{' '}
            <a
              href="mailto:support@manzu.ng"
              className="text-primary hover:text-primary/80 underline transition-colors duration-200"
            >
              support@manzu.ng
            </a>{' '}
            to exercise these rights.
          </p>
        </CardContent>
      </Card>

      <Card
        className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] mb-6 animate-in fade-in-20"
        style={{ animationDelay: '0.7s' }}
      >
        <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
        <CardHeader className="bg-primary/10 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary">Contact Us</h2>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <p className="text-base text-gray-600 font-medium leading-relaxed">
            For questions about this Privacy Policy, contact:
            <br />
            <span className="font-semibold text-gray-900">Wellrica (Manzu)</span>
            <br />
            Email:{' '}
            <a
              href="mailto:support@manzu.ng"
              className="text-primary hover:text-primary/80 underline transition-colors duration-200"
            >
              support@manzu.ng
            </a>
            <br />
            Phone: +234-XXX-XXX-XXXX
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);
}