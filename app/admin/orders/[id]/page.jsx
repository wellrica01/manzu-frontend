"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

function StatusBadge({ status }) {
  let color = "bg-gray-200 text-gray-700";
  if (status === "pending") color = "bg-yellow-100 text-yellow-800";
  else if (status === "confirmed") color = "bg-blue-100 text-blue-800";
  else if (status === "processing") color = "bg-purple-100 text-purple-800";
  else if (status === "shipped") color = "bg-indigo-100 text-indigo-800";
  else if (status === "delivered") color = "bg-green-100 text-green-800";
  else if (status === "ready_for_pickup") color = "bg-cyan-100 text-cyan-800";
  else if (status === "cancelled") color = "bg-red-100 text-red-800";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        setOrder(data.order);
      } catch (e) {
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchOrder();
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
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
      ) : !order ? (
        <div className="text-center text-gray-500">Order not found.</div>
      ) : (
        <Card className="p-6 bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-[#225F91] mb-4">Order Details</h2>
          <div className="space-y-2">
            <div><span className="font-semibold">Order ID:</span> {order.id}</div>
            <div><span className="font-semibold">Patient Identifier:</span> {order.userIdentifier}</div>
            <div><span className="font-semibold">Status:</span> <StatusBadge status={order.status} /></div>
            <div><span className="font-semibold">Total Price:</span> ₦{order.totalPrice?.toLocaleString?.() ?? order.totalPrice}</div>
            <div><span className="font-semibold">Delivery Method:</span> {order.deliveryMethod || '-'}</div>
            <div><span className="font-semibold">Address:</span> {order.address || '-'}</div>
            <div><span className="font-semibold">Email:</span> {order.email || '-'}</div>
            <div><span className="font-semibold">Phone:</span> {order.phone || '-'}</div>
            <div><span className="font-semibold">Tracking Code:</span> {order.trackingCode || '-'}</div>
            <div><span className="font-semibold">Payment Reference:</span> {order.paymentReference || '-'}</div>
            <div><span className="font-semibold">Payment Status:</span> {order.paymentStatus || '-'}</div>
            <div><span className="font-semibold">Created At:</span> {new Date(order.createdAt).toLocaleString()}</div>
            <div><span className="font-semibold">Updated At:</span> {new Date(order.updatedAt).toLocaleString()}</div>
            <div><span className="font-semibold">Pharmacy:</span> {order.pharmacy?.name || '-'}</div>
            {order.prescription && (
              <div className="mt-2">
                <span className="font-semibold">Prescription:</span> ID {order.prescription.id}, Status: {order.prescription.status}
                {order.prescription.fileUrl && (
                  <>
                    {" | "}
                    <a href={order.prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#1ABA7F] underline">View File</a>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Order Items */}
          <div className="mt-8">
            <h3 className="font-semibold text-[#225F91] mb-2">Order Items</h3>
            {order.items && order.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 px-3">Medication</th>
                      <th className="py-2 px-3">Pharmacy</th>
                      <th className="py-2 px-3">Quantity</th>
                      <th className="py-2 px-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 px-3">{item.pharmacyMedication?.medication?.name || '-'}</td>
                        <td className="py-2 px-3">{item.pharmacyMedication?.pharmacy?.name || '-'}</td>
                        <td className="py-2 px-3">{item.quantity}</td>
                        <td className="py-2 px-3">₦{item.price?.toLocaleString?.() ?? item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">No items in this order.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 