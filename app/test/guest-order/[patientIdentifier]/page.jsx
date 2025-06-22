import GuestOrder from "../components/GuestMedicationsPage";

export default function GuestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8 text-center">
          Your Prescribed Lab Services
        </h1>
        <GuestOrder />
      </div>
    </div>
  );
}