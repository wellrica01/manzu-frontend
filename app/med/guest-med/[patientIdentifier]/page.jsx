import GuestMed from "../components/GuestMedicationsPage";

export default function GuestMedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-white/80 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight">
          Your Prescribed Medications
        </h1>
        <GuestMed />
      </div>
    </div>
  );
}