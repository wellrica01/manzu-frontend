import { DollarSign, Clock, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function PayoutSummaryWidget() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/payouts/summary`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (error) {
        console.error('Failed to fetch payout summary:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const hasPendingPayouts = summary.pending.amount > 0;
  const needsBankingSetup = summary.pending.amount > 0 && summary.bankingConfigured === false;

  return (
    <div className="bg-linear-to-br from-green-50 to-blue-50 rounded-lg md:rounded-2xl shadow-lg p-4 md:p-6 border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Payout Status
        </h3>
        <button
          onClick={() => router.push('/pharmacy/payment')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {needsBankingSetup && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">Banking Setup Required</p>
            <p className="text-xs text-yellow-800 mt-1">
              Configure your bank account to receive payouts
            </p>
            <button
              onClick={() => router.push('/pharmacy/payment')}
              className="mt-2 text-xs font-semibold text-yellow-900 hover:text-yellow-700 underline"
            >
              Setup Now
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-lg p-3 md:p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600">Pending</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-orange-600">
            ₦{summary.pending.amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {summary.pending.count} order{summary.pending.count !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 md:p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Paid</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            ₦{summary.completed.amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {summary.completed.count} payout{summary.completed.count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {hasPendingPayouts && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-900">
            <span className="font-semibold">Next payout:</span> Tonight at 11 PM
          </p>
        </div>
      )}
    </div>
  );
}

export default PayoutSummaryWidget;