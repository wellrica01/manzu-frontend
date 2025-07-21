"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

const brandBlue = "#225F91";

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const res = await fetch(`${API_BASE}/api/admin/admin-users/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (res.status === 404) {
          setError("User not found.");
          setUser(null);
        } else if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        } else {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        setError("Failed to load user details.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchUser();
  }, [id]);

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
                <span className="font-semibold text-gray-700">Role:</span> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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