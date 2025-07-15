import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Download, X } from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'ready_for_pickup',
  'cancelled',
];

function isImageFile(url) {
  return url && (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif') || url.endsWith('.webp'));
}

function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase()).replace(/_/g, ' ');
}

export default function OrderDetailsDialog({ open, onClose, order }) {
  const [status, setStatus] = useState(order?.status || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showPrescription, setShowPrescription] = useState(false);

  // Prevent background scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  if (!open || !order) return null;

  const handleStatusChange = (e) => setStatus(e.target.value);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch(`http://localhost:5000/api/pharmacy/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      toast.success('Order status updated successfully');
      onClose();
    } catch (err) {
      setSubmitError(err.message);
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in duration-200">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl shadow-sm px-8 pt-8 pb-4 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Order Details</h2>
          <button
            type="button"
            className="ml-4 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 focus:ring-2 focus:ring-primary focus:outline-none text-gray-700 font-semibold"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="overflow-y-auto px-8 pb-8 pt-4 flex-1 min-h-0">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-medium">Order ID:</span> {order.id}</div>
            <div><span className="font-medium">Name:</span> {order.name}</div>
            <div><span className="font-medium">Status:</span> {capitalizeWords(order.status)}</div>
            <div><span className="font-medium">Delivery Method:</span> {capitalizeWords(order.deliveryMethod)}</div>
            {order.deliveryMethod !== 'pickup' && (
              <div><span className="font-medium">Address:</span> {order.address}</div>
            )}
            <div><span className="font-medium">Total Price:</span> ₦{order.totalPrice?.toLocaleString()}</div>
            <div><span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleString()}</div>
          </div>
          {/* Prescription Details */}
          {order.prescription && order.prescription.fileUrl && (
            <div className="mb-8">
              <div className="bg-white border border-primary/20 rounded-xl shadow p-4 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex flex-col items-center md:items-start gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">Prescription</span>
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none font-semibold transition"
                    onClick={() => setShowPrescription(true)}
                  >
                    View Prescription
                  </button>
                </div>
              </div>
              {/* Prescription Modal Overlay */}
              {showPrescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full flex flex-col items-center">
                    <button
                      type="button"
                      className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-primary focus:outline-none"
                      onClick={() => setShowPrescription(false)}
                      aria-label="Close prescription preview"
                    >
                      <X className="w-5 h-5 text-gray-700" />
                    </button>
                    {isImageFile(order.prescription.fileUrl) ? (
                      <img
                        src={order.prescription.fileUrl}
                        alt="Prescription file"
                        className="w-full max-h-[70vh] object-contain rounded shadow border border-primary/20 bg-white"
                      />
                    ) : (
                      <a
                        href={order.prescription.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-primary/10 rounded hover:bg-primary/20 transition mt-4"
                      >
                        <Download className="w-5 h-5 text-primary" />
                        <span className="text-primary font-medium">Download Prescription</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Items</h3>
            <table className="min-w-full bg-gray-50 rounded">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Medication</th>
                  <th className="px-2 py-1 text-left">Quantity</th>
                  <th className="px-2 py-1 text-left">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-2 py-1">{item.medication.name}</td>
                    <td className="px-2 py-1">{item.quantity}</td>
                    <td className="px-2 py-1">₦{item.price?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={handleUpdateStatus} className="space-y-4" aria-label="Update order status form">
            <div>
              <label className="block mb-1 font-medium" htmlFor="order-status-select">Update Status</label>
              <select
                id="order-status-select"
                value={status}
                onChange={handleStatusChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                required
                aria-required="true"
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{capitalizeWords(opt)}</option>
                ))}
              </select>
            </div>
            {submitError && <p className="text-red-500">{submitError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-150 font-semibold disabled:opacity-60"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Updating...</span> : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 