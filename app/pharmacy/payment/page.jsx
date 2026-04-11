"use client";
import { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff,
  ArrowRight,
  Wallet,
  Activity,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  ChevronRight,
  Package,
} from "lucide-react";

const brandBlue = "#225F91";
const brandGreen = "#1ABA7F";
const brandOrange = "#FF6B35";
const brandPurple = "#7C3AED";
const brandRed = "#EF4444";


// API Functions
// Helper to safely get token
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("pharmacyToken");
}

// Helper to create auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// API Functions with improved error handling
async function fetchBankingStatus() {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/banking/status`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch banking status");
  }
  return res.json();
}

async function fetchNigerianBanks() {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/banking/banks`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch banks");
  }
  return res.json();
}

async function verifyBankAccount(accountNumber, bankCode) {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/banking/verify`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ accountNumber, bankCode }),
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Account verification failed" }));
    throw new Error(error.message || "Account verification failed");
  }
  return res.json();
}

async function setupBankAccount(accountNumber, bankCode, bankName) {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/banking/setup`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ accountNumber, bankCode, bankName }),
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Banking setup failed" }));
    throw new Error(error.message || "Banking setup failed");
  }
  return res.json();
}

async function updateBankAccount(accountNumber, bankCode, bankName) {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/banking/update`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ accountNumber, bankCode, bankName }),
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Banking update failed" }));
    throw new Error(error.message || "Banking update failed");
  }
  return res.json();
}

async function fetchPayoutSummary() {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/payouts/summary`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch payout summary");
  }
  return res.json();
}

async function fetchPayoutHistory(page = 1, limit = 20) {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/payouts/history?page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch payout history");
  }
  return res.json();
}

async function fetchPendingPayoutOrders() {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders/pending-payout`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch pending payout orders");
  }
  return res.json();
}

async function fetchEarningsAnalytics(period = "week") {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/earnings/analytics?period=${period}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch earnings analytics");
  }
  return res.json();
}

// Components
function Card({ children, className }) {
  return (
    <div className={`bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-200/50 ${className || ""}`}>
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, subtitle, prefix = "" }) {
  return (
    <Card className="p-4 md:p-6 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div
          className="p-2 md:p-3 rounded-lg md:rounded-2xl group-hover:scale-110 transition-transform duration-300"
          style={{ background: `linear-gradient(135deg, ${color}15, ${color}25)` }}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color }} />
        </div>
      </div>
      <div className="space-y-0.5 md:space-y-1">
        <div className="text-2xl md:text-3xl font-bold text-gray-900">
          {prefix}
          {value}
        </div>
        <div className="text-xs md:text-sm font-medium text-gray-600">{label}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </Card>
  );
}

function BankingSetupCard({ bankingStatus, onSetup }) {
  // FIX: Initialize showForm based on whether banking is already set up
  const [showForm, setShowForm] = useState(!bankingStatus?.hasSetup);
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: "",
    bankCode: "",
    bankName: "",
  });
  const [verifying, setVerifying] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState("");

  // FIX: Load banks when form should be visible
  useEffect(() => {
    const needsForm = !bankingStatus?.hasSetup || showForm;
    if (needsForm && banks.length === 0 && !loadingBanks) {
      loadBanks();
    }
  }, [showForm, bankingStatus?.hasSetup]);

  async function loadBanks() {
    setLoadingBanks(true);
    try {
      const data = await fetchNigerianBanks();
      setBanks(data.banks || []);
    } catch (err) {
      setError("Failed to load banks list");
    } finally {
      setLoadingBanks(false);
    }
  }


  async function handleVerify() {
    if (formData.accountNumber.length !== 10) {
      setError("Account number must be 10 digits");
      return;
    }
    if (!formData.bankCode) {
      setError("Please select a bank");
      return;
    }

    setVerifying(true);
    setError("");
    setVerifiedAccountName("");

    try {
      const result = await verifyBankAccount(formData.accountNumber, formData.bankCode);
      setVerifiedAccountName(result.accountName);
      setError("");
    } catch (err) {
      setError(err.message);
      setVerifiedAccountName("");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit() {
    if (!verifiedAccountName) {
      setError("Please verify account first");
      return;
    }

    setSetupLoading(true);
    setError("");

    try {
      if (bankingStatus.hasSetup) {
        await updateBankAccount(formData.accountNumber, formData.bankCode, formData.bankName);
      } else {
        await setupBankAccount(formData.accountNumber, formData.bankCode, formData.bankName);
      }
      onSetup();
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSetupLoading(false);
    }
  }

  if (bankingStatus.hasSetup && !showForm) {
    return (
      <Card className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Banking Configured</h3>
              <p className="text-sm text-gray-600">Your account is ready to receive payouts</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Bank Name</span>
            <span className="font-semibold text-gray-900">{bankingStatus.bankName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Account Number</span>
            <span className="font-mono font-semibold text-gray-900">
              {bankingStatus.accountNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Account Name</span>
            <span className="font-semibold text-gray-900">{bankingStatus.accountName}</span>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Update Banking Details
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-xl bg-blue-50">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">
            {bankingStatus.hasSetup ? "Update Banking Details" : "Setup Bank Account"}
          </h3>
          <p className="text-sm text-gray-600">
            {bankingStatus.hasSetup
              ? "Update your bank account information"
              : "Configure your bank account to receive payouts"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bank *
          </label>
          <select
            value={formData.bankCode}
            onChange={(e) => {
              const selectedBank = banks.find((b) => b.code === e.target.value);
              setFormData({
                ...formData,
                bankCode: e.target.value,
                bankName: selectedBank?.name || "",
              });
              setVerifiedAccountName("");
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingBanks}
          >
            <option value="">
              {loadingBanks ? "Loading banks..." : "Choose your bank"}
            </option>
            {banks.map((bank, index) => (
              <option key={`${bank.code}-${index}`} value={bank.code}>
                {bank.name}
              </option>
            ))}

          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number *
          </label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              setFormData({ ...formData, accountNumber: value });
              setVerifiedAccountName("");
            }}
            placeholder="0123456789"
            maxLength={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">Enter your 10-digit account number</p>
        </div>

        {verifiedAccountName && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Account Verified</p>
                <p className="text-sm text-green-700">{verifiedAccountName}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {showForm && bankingStatus.hasSetup && (
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          )}
          {!verifiedAccountName ? (
            <button
              onClick={handleVerify}
              disabled={
                verifying || formData.accountNumber.length !== 10 || !formData.bankCode
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={setupLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {setupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {bankingStatus.hasSetup ? "Updating..." : "Setting up..."}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {bankingStatus.hasSetup ? "Update Banking" : "Complete Setup"}
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">Important:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Payouts are processed daily at 11 PM</li>
              <li>Orders must be marked as "Completed" to be eligible</li>
              <li>Funds arrive within 24 hours (T+1)</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PayoutHistoryCard({ payouts, pagination, onPageChange, loading }) {
  const getStatusBadge = (status) => {
    const styles = {
      COMPLETED: "bg-green-100 text-green-800 border-green-300",
      PROCESSING: "bg-blue-100 text-blue-800 border-blue-300",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      FAILED: "bg-red-100 text-red-800 border-red-300",
    };

    const icons = {
      COMPLETED: CheckCircle,
      PROCESSING: Clock,
      PENDING: Clock,
      FAILED: XCircle,
    };

    const Icon = icons[status] || Clock;
    const style = styles[status] || styles.PENDING;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }


  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        Payout History
      </h3>

      {payouts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payout history yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Complete orders will be paid out daily
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        #{payout.reference.split("_").pop()}
                      </span>
                      {getStatusBadge(payout.status)}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(payout.initiatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {payout.orderIds.length} order{payout.orderIds.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ₦{parseFloat(payout.amount).toLocaleString()}
                    </div>
                    {payout.completedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Received{" "}
                        {new Date(payout.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function PaymentAccountPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bankingStatus, setBankingStatus] = useState(null);
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [banking, summary, history, pending] = await Promise.all([
        fetchBankingStatus(),
        fetchPayoutSummary(),
        fetchPayoutHistory(pagination.page, pagination.limit),
        fetchPendingPayoutOrders(),
      ]);

      setBankingStatus(banking);
      setPayoutSummary(summary);
      setPayoutHistory(history.payouts || []);
      setPagination(history.pagination || pagination);
      setPendingOrders(pending.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleRefresh() {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin w-12 h-12 text-[#1ABA7F] mx-auto" />
          <p className="text-lg text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <p className="text-xl font-semibold text-red-600">{error}</p>
          <button
            onClick={loadAllData}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Payment & Payouts
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            Manage your bank account and track earnings
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 md:p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Banking Status Alert */}
      {!bankingStatus?.hasSetup && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900">Banking Setup Required</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Configure your bank account below to start receiving payouts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payout Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Clock}
          label="Pending Payout"
          value={payoutSummary?.pending.amount.toLocaleString() || "0"}
          color={brandOrange}
          subtitle={`${payoutSummary?.pending.count || 0} completed orders`}
          prefix="₦"
        />
        <MetricCard
          icon={Activity}
          label="Processing"
          value={payoutSummary?.processing.amount.toLocaleString() || "0"}
          color={brandBlue}
          subtitle={`${payoutSummary?.processing.count || 0} in progress`}
          prefix="₦"
        />
        <MetricCard
          icon={CheckCircle}
          label="Total Paid"
          value={payoutSummary?.completed.amount.toLocaleString() || "0"}
          color={brandGreen}
          subtitle={`${payoutSummary?.completed.count || 0} payouts`}
          prefix="₦"
        />
        <MetricCard
          icon={XCircle}
          label="Failed"
          value={payoutSummary?.failed.amount.toLocaleString() || "0"}
          color={brandRed}
          subtitle={`${payoutSummary?.failed.count || 0} failed`}
          prefix="₦"
        />
      </div>

      {/* Banking Setup Section */}
      <BankingSetupCard bankingStatus={bankingStatus} onSetup={loadAllData} />

      {/* Pending Payout Orders */}
      {pendingOrders.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Orders Awaiting Payout
          </h3>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-orange-900">
                    {pendingOrders.length}
                  </span>{" "}
                  completed order{pendingOrders.length > 1 ? "s" : ""} ready for payout
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Will be processed in tonight's batch (11 PM)
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  ₦
                  {pendingOrders
                    .reduce((sum, order) => sum + (order.pharmacyAmount || 0), 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      Order #{order.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.filledAt || order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ₦{(order.pharmacyAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.platformFee
                      ? `(${((order.platformFee / order.totalPrice) * 100).toFixed(1)}% fee)`
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {pendingOrders.length > 5 && (
            <p className="text-xs text-center text-gray-500 mt-3">
              + {pendingOrders.length - 5} more orders
            </p>
          )}
        </Card>
      )}

      {/* Payout Schedule Info */}
      <Card className="p-4 md:p-6 bg-linear-to-br from-blue-50 to-purple-50">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-white shadow-sm">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              Payout Schedule & Process
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="font-semibold text-gray-900">Complete Orders</p>
                </div>
                <p className="text-xs text-gray-600">
                  Mark orders as "Completed" after customer pickup/delivery
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="font-semibold text-gray-900">Daily Processing</p>
                </div>
                <p className="text-xs text-gray-600">
                  All completed orders batched at 11 PM daily
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="font-semibold text-gray-900">Receive Payment</p>
                </div>
                <p className="text-xs text-gray-600">
                  Funds arrive in your account within 24 hours (T+1)
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
            <p className="text-xs text-gray-700">
                <span className="font-semibold">Commission Structure:</span> Platform takes a flat 8% commission on all orders. You keep 92% of every sale.
            </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Payout History */}
      <PayoutHistoryCard
        payouts={payoutHistory}
        pagination={pagination}
        onPageChange={(newPage) => {
          setPagination({ ...pagination, page: newPage });
          fetchPayoutHistory(newPage, pagination.limit).then((data) => {
            setPayoutHistory(data.payouts || []);
            setPagination(data.pagination || pagination);
          });
        }}
        loading={false}
      />

      {/* Help Section */}
      <Card className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              When do I receive payouts?
            </h4>
            <p className="text-sm text-gray-600">
              Payouts are processed daily at 11 PM Lagos time. All orders marked as
              "Completed" will be included in that day's batch. Funds typically arrive in
              your account within 24 hours (T+1).
            </p>
          </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">
            What is the commission rate?
        </h4>
        <p className="text-sm text-gray-600">
            We charge a simple flat rate of <span className="font-semibold">8% commission</span> on all orders, regardless of order value. This means you keep 92% of every sale. No complex tiers or calculations - just straightforward, transparent pricing.
        </p>
        </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              Can I update my bank account?
            </h4>
            <p className="text-sm text-gray-600">
              Yes, you can update your bank account anytime using the "Update Banking
              Details" button above. The new account will be verified before activation.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              What if a payout fails?
            </h4>
            <p className="text-sm text-gray-600">
              Failed payouts are automatically retried every 2 hours. If issues persist,
              our support team will contact you. Ensure your bank account details are
              correct to avoid failures.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}