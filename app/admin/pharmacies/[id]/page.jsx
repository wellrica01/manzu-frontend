"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import PharmacyForm from "../PharmacyForm";
import { fetchPharmacy } from "../api";

const brandBlue = "#225F91";

export default function PharmacyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const isEdit = searchParams.get("edit") === "1";
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  async function loadPharmacy() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPharmacy(id);
      setPharmacy(data.data?.pharmacy || null);
    } catch (e) {
      setError("Failed to load pharmacy details.");
    } finally {
      setLoading(false);
    }
  }
  if (id) loadPharmacy();
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
      ) : !pharmacy ? (
        <div className="text-center text-gray-500">Pharmacy not found.</div>
      ) : isEdit ? (
        <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-[#225F91] mb-4">Edit Pharmacy</h2>
          <PharmacyForm pharmacy={pharmacy} mode="edit" />
        </Card>
      ) : (
        <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-[#225F91] mb-4">Pharmacy Details</h2>
          <div className="space-y-2">
            <div><span className="font-semibold">Name:</span> {pharmacy.name}</div>
            <div><span className="font-semibold">Address:</span> {pharmacy.address}</div>
            <div><span className="font-semibold">State:</span> {pharmacy.state}</div>
            <div><span className="font-semibold">LGA:</span> {pharmacy.lga}</div>
            <div><span className="font-semibold">Phone:</span> {pharmacy.phone}</div>
            <div><span className="font-semibold">License Number:</span> {pharmacy.licenseNumber}</div>
            <div><span className="font-semibold">Status:</span> {pharmacy.status}</div>
            <div><span className="font-semibold">Active:</span> {pharmacy.isActive ? "Yes" : "No"}</div>
            <div><span className="font-semibold">Created At:</span> {new Date(pharmacy.createdAt).toLocaleString()}</div>
            {pharmacy.verifiedAt && (
              <div><span className="font-semibold">Verified At:</span> {new Date(pharmacy.verifiedAt).toLocaleString()}</div>
            )}
            {pharmacy.logoUrl && (
              <div className="mt-2">
                <img src={pharmacy.logoUrl} alt="Pharmacy Logo" className="h-20 w-20 object-contain rounded" />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <Link
              href={`/admin/pharmacies/${pharmacy.id}?edit=1`}
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