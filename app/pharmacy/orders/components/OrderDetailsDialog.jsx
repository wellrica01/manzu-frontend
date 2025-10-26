import React, { useState, useEffect } from 'react';
import { 
  Loader2, FileText, Download, X, User, Phone, Mail, MapPin,
  Package, DollarSign, Calendar, Truck, CheckCircle, Clock,
  AlertCircle, ChevronRight, Eye, CreditCard, Home
} from 'lucide-react';

const statusOptions = [
  { value: 'CONFIRMED', label: 'Confirmed', color: '#F59E0B', icon: CheckCircle },
  { value: 'PROCESSING', label: 'Processing', color: '#3B82F6', icon: Package },
  { value: 'SHIPPED', label: 'Shipped', color: '#06B6D4', icon: Truck },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup', color: '#8B5CF6', icon: CheckCircle },
  { value: 'DELIVERED', label: 'Delivered', color: '#10B981', icon: CheckCircle },
  { value: 'CANCELLED', label: 'Cancelled', color: '#F59E0B', icon: AlertCircle },

];

function isImageFile(url) {
  return url && (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif') || url.endsWith('.webp'));
}

function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase()).replace(/_/g, ' ');
}

export default function OrderDetailsDialog({ open, onClose, order, onStatusUpdate }) {
  const [status, setStatus] = useState(order?.status || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showPrescription, setShowPrescription] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      
      if (onStatusUpdate) {
        onStatusUpdate('Order status updated successfully', 'success');
      }
      onClose();
    } catch (err) {
      setSubmitError(err.message);
      if (onStatusUpdate) {
        onStatusUpdate(err.message || 'Failed to update order status', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatus = statusOptions.find(opt => opt.value === status);
  const deliveryMethod = order.deliveryMethod?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-white rounded-t-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Order Details</h2>
                <p className="text-white/80 text-xs">#{order.sn}</p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              onClick={onClose}
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 py-4 flex-1 min-h-0 space-y-4">
          
          {/* Status Section */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {currentStatus && <currentStatus.icon className="w-5 h-5" style={{ color: currentStatus.color }} />}
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">Current Status</h3>
                  <p className="text-xs text-gray-600">Track order progress</p>
                </div>
              </div>
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-md"
                style={{ backgroundColor: currentStatus?.color || '#6B7280' }}
              >
                {capitalizeWords(order.status)}
              </span>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block mb-1.5 font-medium text-sm text-gray-700" htmlFor="order-status-select">
                  Update Order Status
                </label>
                <select
                  id="order-status-select"
                  value={status}
                  onChange={handleStatusChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1ABA7F] focus:border-[#1ABA7F] transition-all"
                  required
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {submitError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs">{submitError}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#1ABA7F] text-white text-sm rounded-lg hover:bg-[#159e6a] focus:ring-2 focus:ring-[#1ABA7F] transition-all font-semibold disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                disabled={submitting || status === order.status}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Status...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Order Status
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Customer & Delivery Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#225F91]" />
                <h3 className="font-semibold text-sm text-gray-900">Customer Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="font-medium text-sm text-gray-900">{order.name || 'N/A'}</div>
                  </div>
                </div>
                {order.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="font-medium text-sm text-gray-900">{order.phone}</div>
                    </div>
                  </div>
                )}
                {order.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="font-medium text-sm text-gray-900">{order.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {deliveryMethod === 'pickup' ? (
                  <Home className="w-4 h-4 text-[#225F91]" />
                ) : (
                  <Truck className="w-4 h-4 text-[#225F91]" />
                )}
                <h3 className="font-semibold text-sm text-gray-900">Delivery Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Method</div>
                    <div className="font-medium text-sm text-gray-900">
                      {capitalizeWords(order.deliveryMethod)}
                    </div>
                  </div>
                </div>
                {deliveryMethod !== 'pickup' && order.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Delivery Address</div>
                      <div className="font-medium text-sm text-gray-900">{order.address}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Order Date</div>
                    <div className="font-medium text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prescription Section */}
          {order.prescription && order.prescription.fileUrl && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Prescription Attached</h3>
                    <p className="text-xs text-gray-600">View prescription document</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-1.5 shadow-md"
                  onClick={() => setShowPrescription(true)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
              </div>

              {/* Prescription Modal */}
              {showPrescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                  <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-3xl w-full max-h-[90vh] overflow-auto">
                    <button
                      type="button"
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                      onClick={() => setShowPrescription(false)}
                    >
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Prescription Document</h3>
                    {isImageFile(order.prescription.fileUrl) ? (
                      <img
                        src={order.prescription.fileUrl}
                        alt="Prescription file"
                        className="w-full max-h-[70vh] object-contain rounded-lg shadow-lg border-2 border-gray-200"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-3">This prescription is not an image file</p>
                        
                          href={order.prescription.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#225F91] text-white text-sm rounded-lg hover:bg-[#1A4971] transition-colors font-semibold shadow-md"
                          <Download className="w-4 h-4" />
                          Download Prescription
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-[#225F91]" />
              <h3 className="font-semibold text-sm text-gray-900">Order Items</h3>
              <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {order.items?.length || 0} Products
              </span>
            </div>
            
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {item.medication?.displayName || item.medication?.brandName || 'Unknown Medication'}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Quantity: <span className="font-semibold">{item.quantity}</span>
                      {' • '}
                      Price: <span className="font-semibold">₦{item.price?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[#1ABA7F]">
                      ₦{((item.quantity || 0) * (item.price || 0)).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Subtotal</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-sm text-gray-900">Order Summary</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-semibold text-sm text-gray-900">
                  ₦{order.totalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600">Delivery Fee</span>
                <span className="font-semibold text-sm text-gray-900">₦0</span>
              </div>
              <div className="pt-2 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₦{order.totalPrice?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-gray-600 mb-0.5">Total Items</div>
              <div className="text-xl font-bold text-blue-600">
                {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xs text-gray-600 mb-0.5">Products</div>
              <div className="text-xl font-bold text-purple-600">
                {order.items?.length || 0}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-0.5">Revenue</div>
              <div className="text-lg font-bold text-green-600">
                ₦{order.totalPrice?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}