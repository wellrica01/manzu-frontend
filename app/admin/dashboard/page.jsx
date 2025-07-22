"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, CheckCircle, Users, Package, ShoppingBag, FileText, Clock, Layers, FlaskConical, Beaker, Factory, Pill, BookOpen } from "lucide-react";
import { fetchDashboard } from "./api";

const brandBlue = "#225F91";
const brandGreen = "#1ABA7F";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="flex flex-col items-center justify-center p-6 rounded-2xl shadow-md bg-white/95 border border-[#1ABA7F]/20 min-w-[180px]">
      <div className={`p-3 rounded-full mb-3`} style={{ background: color + '20' }}>
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboard();
        setStats(data.summary || data);
        setLoading(false);
      } catch (e) {
        setError("Failed to load dashboard data.");
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-[#225F91] mb-6">Admin Dashboard</h1>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-8 h-8 text-[#1ABA7F]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 text-red-600">
          <AlertTriangle className="w-8 h-8" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
            <StatCard icon={Package} label="Pharmacies" value={stats.pharmacies.total} color={brandBlue} />
            <StatCard icon={CheckCircle} label="Verified Pharmacies" value={stats.pharmacies.verified} color={brandGreen} />
            <StatCard icon={ShoppingBag} label="Medications" value={stats.medications.total} color={brandBlue} />
            <StatCard icon={FileText} label="Prescriptions" value={stats.prescriptions.total} color={brandBlue} />
            <StatCard icon={Clock} label="Pending Prescriptions" value={stats.prescriptions.pending} color={brandGreen} />
            <StatCard icon={Users} label="Admin Users" value={stats.users.total} color={brandBlue} />
            {/* New Stats */}
            <StatCard icon={Layers} label="Categories" value={stats.categories?.total ?? 0} color={brandBlue} />
            <StatCard icon={FlaskConical} label="Therapeutic Classes" value={stats.therapeuticClasses?.total ?? 0} color={brandBlue} />
            <StatCard icon={Beaker} label="Chemical Classes" value={stats.chemicalClasses?.total ?? 0} color={brandBlue} />
            <StatCard icon={Factory} label="Manufacturers" value={stats.manufacturers?.total ?? 0} color={brandBlue} />
            <StatCard icon={Pill} label="Generic Medications" value={stats.genericMedications?.total ?? 0} color={brandBlue} />
            <StatCard icon={BookOpen} label="Indications" value={stats.indications?.total ?? 0} color={brandBlue} />
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white/95 rounded-2xl shadow-md border border-[#1ABA7F]/20 p-6">
            <h2 className="text-xl font-semibold text-[#225F91] mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Tracking Code</th>
                    <th className="py-2 px-3">Patient</th>
                    <th className="py-2 px-3">Total Price</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(stats.orders?.recent) && stats.orders.recent.length > 0 ? (
                    stats.orders.recent.map((order) => (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-medium text-gray-900">{order.id}</td>
                        <td className="py-2 px-3">{order.trackingCode}</td>
                        <td className="py-2 px-3">{order.userIdentifier}</td>
                        <td className="py-2 px-3">₦{order.totalPrice?.toLocaleString?.() ?? order.totalPrice}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "filled"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 px-3">{order.createdAt}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">
                        No recent orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
