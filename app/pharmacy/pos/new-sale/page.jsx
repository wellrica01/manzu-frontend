"use client";
import { useState, useEffect } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, CreditCard,
  Banknote, CheckCircle, AlertTriangle, Loader2, Receipt,
  DollarSign, Package, X, Calculator, Clock, User
} from "lucide-react";

const brandGreen = "#1ABA7F";
const brandBlue = "#225F91";

// Mock AutocompleteInput for demo
function AutocompleteInput({ value, onChange, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const mockMeds = [
    { medicationId: 1, brandName: "Paracetamol 500mg", form: "Tablet", stock: 150, price: 500, packSizeExpression: "20", packSizeUnit: "tabs" },
    { medicationId: 2, brandName: "Amoxicillin 250mg", form: "Capsule", stock: 80, price: 1200, packSizeExpression: "10", packSizeUnit: "caps" },
    { medicationId: 3, brandName: "Ibuprofen 400mg", form: "Tablet", stock: 200, price: 800, packSizeExpression: "20", packSizeUnit: "tabs" },
    { medicationId: 4, brandName: "Cetirizine 10mg", form: "Tablet", stock: 120, price: 600, packSizeExpression: "10", packSizeUnit: "tabs" },
    { medicationId: 5, brandName: "Omeprazole 20mg", form: "Capsule", stock: 90, price: 1500, packSizeExpression: "14", packSizeUnit: "caps" },
  ];

  const handleSearch = (val) => {
    setQuery(val);
    if (val.length >= 2) {
      const filtered = mockMeds.filter(med => 
        med.brandName.toLowerCase().includes(val.toLowerCase())
      );
      setResults(filtered);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
      />
      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((med) => (
            <button
              key={med.medicationId}
              onClick={() => {
                onChange(med);
                setQuery("");
                setShowResults(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="font-medium text-gray-900">{med.brandName}</div>
              <div className="text-sm text-gray-600">{med.form} • Stock: {med.stock}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove }) {
  const subtotal = item.price * item.quantity;
  const maxQuantity = item.availableStock;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 md:p-3 hover:shadow-md transition-shadow">
      {/* Main container */}
      <div className="space-y-2.5">
        
        {/* Top Row - Info & Remove */}
        <div className="flex justify-between items-start gap-2">
          {/* Item Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm md:text-base text-gray-900 truncate">{item.name}</h4>
            <p className="text-xs md:text-sm text-gray-600">{item.form} • {item.packSize}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Stock: <span className="font-medium text-gray-700">{maxQuantity}</span>
            </p>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.medicationId)}
            className="p-1 md:p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>

        {/* Bottom Row - Quantity & Price */}
        <div className="flex justify-between items-center gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => onUpdateQuantity(item.medicationId, Math.max(1, item.quantity - 1))}
              className="p-1 md:p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                onUpdateQuantity(item.medicationId, Math.min(maxQuantity, Math.max(1, val)));
              }}
              className="w-12 md:w-14 text-center border border-gray-300 rounded-md py-0.5 md:py-1 text-sm font-semibold"
              min="1"
              max={maxQuantity}
            />
            <button
              onClick={() => onUpdateQuantity(item.medicationId, Math.min(maxQuantity, item.quantity + 1))}
              className="p-1 md:p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              disabled={item.quantity >= maxQuantity}
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-sm md:text-base text-gray-900">₦{subtotal.toLocaleString()}</div>
            <div className="text-xs text-gray-500">@ ₦{item.price.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Stock Warning */}
      {item.quantity >= maxQuantity && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 p-1.5 rounded">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>Max quantity reached</span>
        </div>
      )}
    </div>
  );
}

function PaymentMethodButton({ method, icon: Icon, label, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(method)}
      className={`flex-1 flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-lg md:rounded-lg border-2 transition-all ${
        selected
          ? 'border-[#1ABA7F] bg-[#1ABA7F]/10 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-5 h-5 md:w-6 md:h-6 ${selected ? 'text-[#1ABA7F]' : 'text-gray-600'}`} />
      <span className={`text-sm md:text-base font-medium ${selected ? 'text-[#1ABA7F]' : 'text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}

function ReceiptModal({ sale, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-white p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 md:w-6 md:h-6" />
              <h2 className="text-lg md:text-xl font-bold">Sale Receipt</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-xs md:text-sm">
            <Clock className="w-3 h-3 md:w-4 md:h-4" />
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Sale ID */}
          <div className="text-center pb-3 md:pb-4 border-b border-gray-200">
            <div className="text-xs md:text-sm text-gray-600">Transaction ID</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">#{sale.id}</div>
          </div>

          {/* Items */}
          <div className="space-y-2 md:space-y-3">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Items Sold
            </h3>
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs md:text-sm">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-gray-500">
                    {item.quantity} × ₦{item.price.toLocaleString()}
                  </div>
                </div>
                <div className="font-semibold text-gray-900 flex-shrink-0">
                  ₦{(item.quantity * item.price).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-3 md:pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-base md:text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl md:text-2xl font-bold text-[#1ABA7F]">
                ₦{sale.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
            <span className="text-xs md:text-sm text-gray-600">Payment Method</span>
            <span className="text-sm md:text-base font-semibold text-gray-900">{sale.paymentMethod.toUpperCase()}</span>
          </div>

          {/* Success Message */}
          <div className="flex items-center gap-2 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
            <span className="text-xs md:text-sm text-green-800 font-medium">Sale completed successfully!</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 md:p-6 border-t border-gray-200 flex gap-2 md:gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4971] transition-colors text-sm md:text-base font-semibold"
          >
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base font-semibold"
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
      
      if (!inventoryItem.stock || inventoryItem.stock <= 0) {
        setError(`${inventoryItem.brandName} is out of stock`);
        return;
      }
      
      const existing = cart.find(item => item.medicationId === inventoryItem.medicationId);
      if (existing) {
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
    const token = localStorage.getItem('pharmacyToken');
    
    // Format items for the API
    const formattedItems = cart.map(item => ({
      medicationId: item.medicationId,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
    }));

    // Make the API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: formattedItems,
        total: calculateTotal(),
        paymentMethod: paymentMethod,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to complete sale');
    }

    const data = await response.json();

    // Show receipt with the sale data
    setCompletedSale({
      id: data.sale.id,
      items: cart,
      total: calculateTotal(),
      paymentMethod: paymentMethod,
    });

    // Clear cart and reset
    setCart([]);
    setPaymentMethod("CASH");
  } catch (err) {
    console.error('Sale error:', err);
    setError(err.message || 'Failed to complete sale. Please try again.');
  } finally {
    setProcessing(false);
  }
};


  const total = calculateTotal();

  return (
    <div className="space-y-4 md:space-y-6 py-2 md:py-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#225F91] to-[#1ABA7F] bg-clip-text text-transparent">
            Point of Sale
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Process walk-in customer sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Side - Product Search & Cart */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Search */}
          <div className="bg-white border border-gray-200 rounded-lg md:rounded-2xl shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-[#225F91]" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Search Medications</h2>
            </div>
            <AutocompleteInput
              value={selectedMedication}
              onChange={(selected) => {
                if (selected) {
                  handleAddToCart(selected);
                }
              }}
              placeholder="Type medication name..."
            />
          </div>

          {/* Cart */}
          <div className="bg-white border border-gray-200 rounded-lg md:rounded-2xl shadow-sm p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-[#225F91]" />
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Cart ({cart.length})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs md:text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-2 md:mb-3" />
                  <p className="text-sm md:text-base text-gray-500">Cart is empty</p>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">Search and add medications</p>
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
        <div className="space-y-4 md:space-y-6">
          {/* Order Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-[#1ABA7F]/30 rounded-lg md:rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Calculator className="w-4 h-4 md:w-5 md:h-5 text-[#225F91]" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Order Summary</h2>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-center text-sm md:text-base text-gray-700">
                <span>Items</span>
                <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              
              <div className="pt-2 md:pt-3 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base md:text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl md:text-3xl font-bold text-[#1ABA7F]">
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-gray-200 rounded-lg md:rounded-2xl shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-[#225F91]" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Payment Method</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-2 md:gap-3">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm md:text-base font-medium text-red-900">Error</p>
                <p className="text-xs md:text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || processing}
            className="w-full py-3 md:py-4 bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-white font-bold text-base md:text-lg rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                <span className="text-sm md:text-base">Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">Complete Sale</span>
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