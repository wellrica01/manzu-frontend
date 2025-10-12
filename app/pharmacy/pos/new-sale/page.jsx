"use client";
import { useState, useEffect } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, CreditCard,
  Banknote, CheckCircle, AlertTriangle, Loader2, Receipt,
  DollarSign, Package, X, Calculator, Clock, User
} from "lucide-react";
import { AutocompleteInput } from "@/components/AutocompleteInput";

const brandGreen = "#1ABA7F";
const brandBlue = "#225F91";

// API functions
async function searchInventory(query) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications?search=${query}&limit=20`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to search inventory');
  const data = await res.json();
  // Return in the format AutocompleteInput expects
  return {
    data: {
      result: {
        medications: data.medications || []
      }
    }
  };
}

async function recordSale(saleData) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/sales`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saleData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to record sale');
  }
  return res.json();
}

// Components
function CartItem({ item, onUpdateQuantity, onRemove }) {
  const subtotal = item.price * item.quantity;
  const maxQuantity = item.availableStock;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
          <p className="text-sm text-gray-600">{item.form} • {item.packSize}</p>
          <p className="text-sm text-gray-500 mt-1">
            Available: <span className="font-medium text-gray-700">{maxQuantity} units</span>
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.medicationId, Math.max(1, item.quantity - 1))}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            disabled={item.quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              onUpdateQuantity(item.medicationId, Math.min(maxQuantity, Math.max(1, val)));
            }}
            className="w-16 text-center border border-gray-300 rounded-md py-1 font-semibold"
            min="1"
            max={maxQuantity}
          />
          <button
            onClick={() => onUpdateQuantity(item.medicationId, Math.min(maxQuantity, item.quantity + 1))}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            disabled={item.quantity >= maxQuantity}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Price & Remove */}
        <div className="text-right">
          <div className="font-bold text-gray-900">₦{subtotal.toLocaleString()}</div>
          <div className="text-xs text-gray-500">@ ₦{item.price.toLocaleString()}</div>
          <button
            onClick={() => onRemove(item.medicationId)}
            className="mt-2 p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stock Warning */}
      {item.quantity >= maxQuantity && (
        <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
          <AlertTriangle className="w-3 h-3" />
          <span>Maximum available quantity reached</span>
        </div>
      )}
    </div>
  );
}

function PaymentMethodButton({ method, icon: Icon, label, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(method)}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-[#1ABA7F] bg-[#1ABA7F]/10 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-6 h-6 ${selected ? 'text-[#1ABA7F]' : 'text-gray-600'}`} />
      <span className={`font-medium ${selected ? 'text-[#1ABA7F]' : 'text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}

function ReceiptModal({ sale, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              <h2 className="text-xl font-bold">Sale Receipt</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sale ID */}
          <div className="text-center pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">Transaction ID</div>
            <div className="text-2xl font-bold text-gray-900">#{sale.id}</div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Items Sold
            </h3>
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-gray-500">
                    {item.quantity} × ₦{item.price.toLocaleString()}
                  </div>
                </div>
                <div className="font-semibold text-gray-900">
                  ₦{(item.quantity * item.price).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-[#1ABA7F]">
                ₦{sale.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Payment Method</span>
            <span className="font-semibold text-gray-900">{sale.paymentMethod.toUpperCase()}</span>
          </div>

          {/* Success Message */}
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Sale completed successfully!</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 px-4 py-3 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4971] transition-colors font-semibold"
          >
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function PharmacyPOSPage() {
  const [cart, setCart] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [error, setError] = useState(null);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleAddToCart = async (inventoryItem) => {
    try {
      setError(null);
      
      // Check stock availability
      if (!inventoryItem.stock || inventoryItem.stock <= 0) {
        setError(`${inventoryItem.brandName} is out of stock`);
        return;
      }
      
      // Check if already in cart
      const existing = cart.find(item => item.medicationId === inventoryItem.medicationId);
      if (existing) {
        // Just increase quantity
        handleUpdateQuantity(inventoryItem.medicationId, existing.quantity + 1);
        setSelectedMedication(null);
        return;
      }

      const newItem = {
        medicationId: inventoryItem.medicationId,
        name: inventoryItem.brandName || 'Unknown',
        form: inventoryItem.form || '',
        packSize: `${inventoryItem.packSizeExpression || ''} ${inventoryItem.packSizeUnit || ''}`.trim(),
        price: inventoryItem.price,
        quantity: 1,
        availableStock: inventoryItem.stock,
      };

      setCart([...cart, newItem]);
      setSelectedMedication(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateQuantity = (medicationId, newQuantity) => {
    setCart(cart.map(item => {
      if (item.medicationId === medicationId) {
        return { ...item, quantity: Math.min(newQuantity, item.availableStock) };
      }
      return item;
    }));
  };

  const handleRemoveItem = (medicationId) => {
    setCart(cart.filter(item => item.medicationId !== medicationId));
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const saleData = {
        items: cart.map(item => ({
          medicationId: item.medicationId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: calculateTotal(),
        paymentMethod: paymentMethod,
      };

      const result = await recordSale(saleData);
      
      // Show receipt
      setCompletedSale({
        id: result.sale.id,
        items: cart,
        total: calculateTotal(),
        paymentMethod: paymentMethod,
      });

      // Clear cart
      setCart([]);
      setPaymentMethod("CASH");
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Point of Sale
          </h1>
          <p className="text-gray-600 mt-2">Process walk-in customer sales</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <User className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Walk-in Customer</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Product Search & Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-[#225F91]" />
              <h2 className="text-lg font-semibold text-gray-900">Search Medications</h2>
            </div>
            <AutocompleteInput
              value={selectedMedication}
              onChange={(selected) => {
                if (selected) {
                  handleAddToCart(selected);
                }
              }}
              fetchOptions={searchInventory}
              placeholder="Type medication name or scan barcode..."
              displayFn={(option) => {
                if (!option) return '';
                const brandName = option.brandName || 'Unknown';
                const form = option.form || '';
                const stock = option.stock || 0;
                return `${brandName} - ${form} (Stock: ${stock})`;
              }}
              minChars={2}
            />
          </div>

          {/* Cart */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-[#225F91]" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear Cart
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Cart is empty</p>
                  <p className="text-sm text-gray-400 mt-1">Search and add medications to start a sale</p>
                </div>
              ) : (
                cart.map(item => (
                  <CartItem
                    key={item.medicationId}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Payment & Checkout */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-[#1ABA7F]/30 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-[#225F91]" />
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-gray-700">
                <span>Items</span>
                <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              
              <div className="pt-3 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-[#1ABA7F]">
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[#225F91]" />
              <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PaymentMethodButton
                method="CASH"
                icon={Banknote}
                label="Cash"
                selected={paymentMethod === "CASH"}
                onClick={setPaymentMethod}
              />
              <PaymentMethodButton
                method="CARD"
                icon={CreditCard}
                label="Card"
                selected={paymentMethod === "CARD"}
                onClick={setPaymentMethod}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || processing}
            className="w-full py-4 bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-white font-bold text-lg rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Sale
              </>
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}