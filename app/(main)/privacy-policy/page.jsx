export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-3xl font-extrabold text-primary mb-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-4">Last updated: June 9, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Introduction</h2>
          <p className="text-sm text-foreground">
            Manzu, operated by Wellrica, is committed to protecting your privacy in compliance with Nigeria’s Data Protection Regulation (NDPR). This Privacy Policy explains how we collect, use, store, and protect your personal data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Data We Collect</h2>
          <ul className="list-disc pl-6 text-sm text-foreground">
            <li>Contact Information: Email and phone number (optional) for order processing and notifications.</li>
            <li>Location Data: Address and geolocation for finding nearby pharmacies.</li>
            <li>Health Data: Prescription files and medication details for order fulfillment.</li>
            <li>Payment Data: Processed securely via Paystack; we do not store payment details.</li>
            <li>Usage Data: Browsing activity to improve our services.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">How We Use Your Data</h2>
          <ul className="list-disc pl-6 text-sm text-foreground">
            <li>Process and fulfill medication orders.</li>
            <li>Communicate order updates via email or SMS.</li>
            <li>Locate nearby pharmacies for delivery or pickup.</li>
            <li>Comply with legal obligations (e.g., NDPR, PCN, NAFDAC).</li>
            <li>Improve our platform’s functionality.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Data Storage and Security</h2>
          <p className="text-sm text-foreground">
            We store your data securely using encryption and access controls. Prescription files are stored with encryption. Data is retained only as long as necessary for order fulfillment or legal compliance.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Your Rights</h2>
          <p className="text-sm text-foreground">Under NDPR, you have the right to:</p>
          <ul className="list-disc pl-6 text-sm text-foreground">
            <li>Access your personal data.</li>
            <li>Request corrections or deletions.</li>
            <li>Withdraw consent at any time.</li>
            <li>File complaints with the Nigeria Data Protection Commission.</li>
          </ul>
          <p className="text-sm text-foreground">
            Contact us at <a href="mailto:support@manzu.ng" className="text-primary hover:underline">support@manzu.ng</a> to exercise these rights.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Contact Us</h2>
          <p className="text-sm text-foreground">
            For questions about this Privacy Policy, contact:<br />
            Wellrica (Manzu)<br />
            Email: <a href="mailto:support@manzu.ng" className="text-primary hover:underline">support@manzu.ng</a><br />
            Phone: +234-XXX-XXX-XXXX
          </p>
        </section>
      </div>
    </div>
  );
}