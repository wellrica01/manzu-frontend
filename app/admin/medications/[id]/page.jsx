"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import MedicationForm from "../MedicationForm";

const brandBlue = "#225F91";

export default function MedicationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const isEdit = searchParams.get("edit") === "1";
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMedication() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const res = await fetch(`${API_BASE}/api/admin/medications/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        setMedication(data.medication);
      } catch (e) {
        setError("Failed to load medication details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMedication();
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <button
        className="flex items-center gap-2 text-[#225F91] hover:underline mb-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-8 h-8 text-[#1ABA7F]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 text-red-600">
          <AlertTriangle className="w-8 h-8" />
          <span>{error}</span>
        </div>
      ) : !medication ? (
        <div className="text-center text-gray-500">Medication not found.</div>
      ) : isEdit ? (
        <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-[#225F91] mb-4">Edit Medication</h2>
          <MedicationForm medication={medication} mode="edit" />
        </Card>
      ) : (
        <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-[#225F91] mb-4">Medication Details</h2>
          <div className="space-y-2">
            <div><span className="font-semibold">Name:</span> {medication.name}</div>
            <div><span className="font-semibold">Generic Name:</span> {medication.genericName}</div>
            <div><span className="font-semibold">Category:</span> {medication.category}</div>
            <div><span className="font-semibold">Manufacturer:</span> {medication.manufacturer}</div>
            <div><span className="font-semibold">Form:</span> {medication.form}</div>
            <div><span className="font-semibold">Dosage:</span> {medication.dosage}</div>
            <div><span className="font-semibold">NAFDAC Code:</span> {medication.nafdacCode}</div>
            <div><span className="font-semibold">Prescription Required:</span> {medication.prescriptionRequired ? "Yes" : "No"}</div>
            <div><span className="font-semibold">Created At:</span> {new Date(medication.createdAt).toLocaleString()}</div>
            {medication.imageUrl && (
              <div className="mt-2">
                <img src={medication.imageUrl} alt="Medication" className="h-20 w-20 object-contain rounded" />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <Link
              href={`/admin/medications/${medication.id}?edit=1`}
              className="px-4 py-2 rounded-lg bg-[#1ABA7F] text-white font-semibold hover:bg-[#159e6a] transition"
            >
              Edit
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
} 