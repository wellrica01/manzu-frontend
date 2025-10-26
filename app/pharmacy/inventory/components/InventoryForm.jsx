"use client";

import { useState, useEffect } from "react";
import {
  Loader2, AlertTriangle, CheckCircle, Info, Package, 
  DollarSign, Calendar, Hash, Upload, X, ChevronDown, ChevronRight
} from "lucide-react";
import { AutocompleteInput } from "@/components/AutocompleteInput";

async function searchMedications(query) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/medication-suggestions?q=${query}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to search medications');
  const data = await res.json();
  // The endpoint returns suggestions array directly or in a wrapper
  const medications = Array.isArray(data) ? data : (data.suggestions || data.medications || []);
  
  // Return in the format AutocompleteInput expects
  return {
    data: {
      result: {
        medications: medications
      }
    }
  };
}

async function createInventoryItem(formData) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create inventory item');
  }
  return res.json();
}

async function updateInventoryItem(medicationId, formData) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications/${medicationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update inventory item');
  }
  return res.json();
}

// Helper Components
const FormSection = ({ title, description, icon: Icon, children, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div 
        className={`px-4 py-3 bg-gray-50 border-b border-gray-200 ${collapsible ? 'cursor-pointer hover:bg-gray-100' : ''}`}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#225F91]" />}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[#225F91]">{title}</h3>
            {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
          </div>
          {collapsible && (
            <button type="button" className="text-gray-400 hover:text-gray-600">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

const FormField = ({ label, required = false, error, help, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-900">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {help && (
      <p className="text-xs text-gray-500 flex items-start gap-1">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        {help}
      </p>
    )}
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
);

const Input = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-[#1ABA7F]'
    }`}
  />
);

// Main Component
export default function InventoryForm({ item = {}, mode = "create", onSuccess }) {
  // Form State
  const [form, setForm] = useState({
    medicationId: item.medicationId || "",
    medication: item.Medication || null,
    stock: item.stock || "",
    price: item.price || "",
    batchNumber: item.batchNumber || "",
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : "",
  });

  // Field Errors
  const [fieldErrors, setFieldErrors] = useState({});

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Validation
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'medicationId':
        if (!value) {
          errors.medicationId = 'Medication is required';
        } else {
          delete errors.medicationId;
        }
        break;
      case 'stock':
        if (value === "" || value < 0) {
          errors.stock = 'Stock must be 0 or greater';
        } else {
          delete errors.stock;
        }
        break;
      case 'price':
        if (!value || value <= 0) {
          errors.price = 'Price must be greater than 0';
        } else {
          delete errors.price;
        }
        break;
      case 'batchNumber':
        if (!value?.trim()) {
          errors.batchNumber = 'Batch number is required';
        } else {
          delete errors.batchNumber;
        }
        break;
      case 'expiryDate':
        if (!value) {
          errors.expiryDate = 'Expiry date is required';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate < today) {
            errors.expiryDate = 'Expiry date cannot be in the past';
          } else {
            delete errors.expiryDate;
          }
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(errors);
    return !errors[name];
  };

  // Event Handlers
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? (value === "" ? "" : parseFloat(value)) : value;
    
    setForm(prev => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Validate on change
    validateField(name, newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate all required fields
    const isValid = [
      validateField('medicationId', form.medicationId),
      validateField('stock', form.stock),
      validateField('price', form.price),
      validateField('batchNumber', form.batchNumber),
      validateField('expiryDate', form.expiryDate),
    ].every(Boolean);

    if (!isValid) {
      setLoading(false);
      setError('Please fix the form errors before submitting');
      return;
    }

    try {
      const payload = {
        medicationId: parseInt(form.medicationId),
        stock: parseInt(form.stock),
        price: parseFloat(form.price),
        batchNumber: form.batchNumber.trim(),
        expiryDate: form.expiryDate,
      };

      if (mode === "edit") {
        await updateInventoryItem(item.medicationId, payload);
      } else {
        await createInventoryItem(payload);
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error('Submit error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!form.expiryDate) return null;
    const expiry = new Date(form.expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Medication Selection */}
        <FormSection 
          title="Medication Information" 
          description="Select the medication to add to inventory"
          icon={Package}
        >
          <FormField 
            label="Medication" 
            required 
            error={fieldErrors.medicationId}
          >
          <AutocompleteInput
              value={form.medication}
              onChange={(selected) => {
                setForm(prev => ({
                  ...prev,
                  medicationId: selected?.id || "",
                  medication: selected,
                }));
                validateField('medicationId', selected?.id || "");
              }}
              fetchOptions={searchMedications}
              placeholder="Type medication name..."
              displayFn={(option) => option?.displayName || option?.brandName || ''}
              disabled={mode === "edit"}
              minChars={2}
            />
            {mode === "edit" && (
              <p className="text-xs text-gray-500 mt-1">
                Medication cannot be changed when editing
              </p>
            )}
            {form.medication && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900">Selected Medication:</p>
                <div className="text-xs text-blue-700 mt-1 space-y-0.5">
                  <p><strong>Brand:</strong> {form.medication.brandName}</p>
                  <p><strong>Manufacturer:</strong> {form.medication.Manufacturer?.name || "Unknown"}</p>
                  <p><strong>Form:</strong> {form.medication.form || "Not specified"}</p>
                  <p><strong>Pack Size:</strong> {form.medication.packSizeExpression} {form.medication.packSizeUnit}</p>
                  {form.medication.prescriptionRequired && (
                    <p className="text-orange-600"><strong>⚠️ Prescription Required</strong></p>
                  )}
                </div>
              </div>
            )}
          </FormField>
        </FormSection>

        {/* Stock & Pricing */}
        <FormSection 
          title="Stock & Pricing" 
          icon={DollarSign}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Stock Quantity" 
              required 
              error={fieldErrors.stock}
            >
           <div className="relative">
                <Input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  error={fieldErrors.stock}
                  placeholder="0"
                  required
                />
                {form.stock !== "" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.stock === 0 ? (
                      <span className="text-xs font-medium text-red-600">Out of Stock</span>
                    ) : form.stock < 10 ? (
                      <span className="text-xs font-medium text-yellow-600">Low Stock</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600">In Stock</span>
                    )}
                  </div>
                )}
              </div>
            </FormField>

            <FormField 
              label="Price per Unit (₦)" 
              required 
              error={fieldErrors.price}
            >
              <Input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                error={fieldErrors.price}
                placeholder="0.00"
                required
              />
            </FormField>
          </div>

          {/* Stock Value Calculation */}
          {form.stock && form.price && (
            <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Total Stock Value:</span>
                <span className="text-xl font-bold text-green-600">
                  ₦{(parseFloat(form.stock) * parseFloat(form.price)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          )}
        </FormSection>

        {/* Batch & Expiry */}
        <FormSection 
          title="Batch & Expiry Information" 
          icon={Calendar}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Batch Number" 
              required 
              error={fieldErrors.batchNumber}
            >
              <Input
                type="text"
                name="batchNumber"
                value={form.batchNumber}
                onChange={handleChange}
                error={fieldErrors.batchNumber}
                placeholder="e.g., LOT-2024-001"
                required
              />
            </FormField>

            <FormField 
              label="Expiry Date" 
              required 
              error={fieldErrors.expiryDate}
            >
              <Input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                error={fieldErrors.expiryDate}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </FormField>
          </div>

          {/* Expiry Warning */}
          {daysUntilExpiry !== null && (
            <div className={`mt-3 p-3 rounded-lg border ${
              daysUntilExpiry < 0 
                ? 'bg-red-50 border-red-300'
                : daysUntilExpiry < 30
                ? 'bg-orange-50 border-orange-300'
                : daysUntilExpiry < 90
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-center gap-2">
                {daysUntilExpiry < 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-red-900">This medication has expired!</p>
                      <p className="text-xs text-red-700">Expired {Math.abs(daysUntilExpiry)} days ago</p>
                    </div>
                  </>
                ) : daysUntilExpiry < 30 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-orange-900">Expiring soon!</p>
                      <p className="text-xs text-orange-700">Expires in {daysUntilExpiry} days</p>
                    </div>
                  </>
                ) : daysUntilExpiry < 90 ? (
                  <>
                    <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-yellow-900">Approaching expiry</p>
                      <p className="text-xs text-yellow-700">Expires in {daysUntilExpiry} days</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-green-900">Good expiry date</p>
                      <p className="text-xs text-green-700">Expires in {daysUntilExpiry} days</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </FormSection>


        {/* Status Messages */}
        {(loading || error || success) && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            {loading && (
              <div className="flex items-center gap-2 text-[#1ABA7F] text-sm">
                <Loader2 className="animate-spin w-4 h-4" />
                <span>Saving inventory item...</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Inventory item {mode === 'edit' ? 'updated' : 'added'} successfully!</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#1ABA7F] text-white text-sm font-semibold rounded-lg hover:bg-[#159e6a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "edit" ? "Update Inventory" : "Add to Inventory"}
          </button>
        </div>
      </form>
    </div>
  );
}