"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { fetchUser } from "../api";

const brandBlue = "#225F91";

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  async function loadUser() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUser(id);
      setUser(data.data?.user || data.user || data);
    } catch (e) {
      setError("Failed to load user details.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  if (id) loadUser();
}, [id]);


  function formatRole(role) {
  if (!role) return "-"; // fallback
  return role
    .replace(/_/g, " ") // SUPER_ADMIN → SUPER ADMIN
    .toLowerCase()      // → super admin
    .replace(/\b\w/g, l => l.toUpperCase()); // → Super Admin
}


  return (
    <div className="max-w-xl mx-auto py-10">
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-2 mb-6 text-[#225F91] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>
      <Card className="p-8 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
        {loading ? (
          <div className="flex flex-col items-center gap-2 h-40 justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-[#1ABA7F]" />
            <span className="text-[#225F91] font-medium">Loading user details...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-red-600 h-40 justify-center">
            <AlertTriangle className="w-8 h-8" />
            <span>{error}</span>
          </div>
        ) : user ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#225F91] mb-2">Admin User Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-gray-700">ID:</span> {user.id}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Name:</span> {user.name}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Role:</span> {formatRole(user.role)}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Created At:</span> {new Date(user.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
} 