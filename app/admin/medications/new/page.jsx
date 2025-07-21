"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import MedicationForm from "../MedicationForm";

export default function NewMedicationPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <button
        className="flex items-center gap-2 text-[#225F91] hover:underline mb-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold text-[#225F91] mb-4">Add New Medication</h2>
        <MedicationForm mode="create" />
      </Card>
    </div>
  );
} 