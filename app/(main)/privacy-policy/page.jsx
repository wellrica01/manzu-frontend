import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" aria-hidden="true" />
      <div className="flex-1 py-12 px-1 sm:px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Privacy Policy
        </h1>
        <p className="text-base text-gray-600 mb-6 text-center font-semibold animate-in slide-in-from-top duration-700" style={{ animationDelay: '0.1s' }}>
          Last updated: June 9, 2025
        </p>

        <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-xl shadow-lg sm:p-6 transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30 mb-6 animate-in fade-in-20" style={{ animationDelay: '0.2s' }}>
          <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#225F91] mb-4">Introduction</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                  Manzu, operated by Wellrica, is committed to protecting your privacy in compliance with Nigeria’s Data Protection Regulation (NDPR). This Privacy Policy explains how we collect, use, store, and protect your personal data.
                </p>
              </div>

              <div className="border-t border-[#1ABA7F]/20 pt-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#225F91] mb-4">Data We Collect</h3>
                <ul className="list-disc pl-6 text-sm sm:text-base text-gray-600 font-medium leading-relaxed space-y-2">
                  <li>Contact Information: Email and phone number (optional) for order processing and notifications.</li>
                  <li>Location Data: Address and geolocation for finding nearby pharmacies.</li>
                  <li>Health Data: Prescription files and medication details for order fulfillment.</li>
                  <li>Payment Data: Processed securely via Paystack; we do not store payment details.</li>
                  <li>Usage Data: Browsing activity to improve our services.</li>
                </ul>
              </div>

              <div className="border-t border-[#1ABA7F]/20 pt-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#225F91] mb-4">How We Use Your Data</h3>
                <ul className="list-disc pl-6 text-sm sm:text-base text-gray-600 font-medium leading-relaxed space-y-2">
                  <li>Process and fulfill medication orders.</li>
                  <li>Communicate order updates via email or SMS.</li>
                  <li>Locate nearby pharmacies for delivery or pickup.</li>
                  <li>Comply with legal obligations (e.g., NDPR, PCN, NAFDAC).</li>
                  <li>Improve our platform’s functionality.</li>
                </ul>
              </div>

              <div className="border-t border-[#1ABA7F]/20 pt-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#225F91] mb-4">Data Storage and Security</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                  We store your data securely using encryption and access controls. Prescription files are stored with encryption. Data is retained only as long as necessary for order fulfillment or legal compliance.
                </p>
              </div>

              <div className="border-t border-[#1ABA7F]/20 pt-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#225F91] mb-4">Your Rights</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed mb-2">
                  Under NDPR, you have the right to:
                </p>
                <ul className="list-disc pl-6 text-sm sm:text-base text-gray-600 font-medium leading-relaxed space-y-2">
                  <li>Access your personal data.</li>
                  <li>Request corrections or deletions.</li>
                  <li>Withdraw consent at any time.</li>
                  <li>File complaints with the Nigeria Data Protection Commission.</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed mt-4">
                  Contact us at{' '}
                  <a
                    href="mailto:support@manzu.ng"
                    className="text-[#1ABA7F] hover:text-[#1ABA7F]/80 underline transition-colors duration-200"
                  >
                    support@manzu.ng
                  </a>{' '}
                  to exercise these rights.
                </p>
              </div>

              <div className="border-t border-[#1ABA7F]/20 pt-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#225F91] mb-4">Contact Us</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                  For questions about this Privacy Policy, contact:
                  <br />
                  <span className="font-semibold text-gray-900">Wellrica (Manzu)</span>
                  <br />
                  Email:{' '}
                  <a
                    href="mailto:support@manzu.ng"
                    className="text-[#1ABA7F] hover:text-[#1ABA7F]/80 underline transition-colors duration-200"
                  >
                    support@manzu.ng
                  </a>
                  <br />
                  Phone: +234-XXX-XXX-XXXX
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}