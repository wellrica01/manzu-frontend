"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, AlertTriangle, CheckCircle, Plus, Trash2, Upload, 
  Info, ChevronDown, ChevronRight, Image as ImageIcon, X 
} from "lucide-react";
import { fetchManufacturers } from "../manufacturers/api";
import { fetchActiveSubstances } from "../active-substances/api";
import { fetchMedicationIngredients } from "../medication-ingredients/api";
import { createMedication, updateMedication, searchManufacturers, searchActiveSubstances, searchMedicationIngredients } from "./api";
import { AutocompleteInput } from "../../components/AutocompleteInput";

// Constants
const DOSAGE_FORMS = [
  "TABLET",   "CAPSULE",   "CAPLET",   "SYRUP", 
  "INJECTION",   "CREAM",   "OINTMENT",   "GEL", 
  "SUSPENSION",   "POWDER",   "SUPPOSITORY",   "EYE_DROP", 
  "EAR_DROP",   "DROPS",   "NASAL_SPRAY",   "INHALER", 
  "PATCH",   "LOZENGE",   "EFFERVESCENT",   "GRANULES", 
  "SOLUTION",   "ORODISPERSIBLE_FILM",   "INFUSION", 
  "LYOPHILIZED_POWDER",   "NEBULIZER_SOLUTION",   "EYE_OINTMENT", 
  "EAR_SPRAY",   "LOTION",   "PASTE",  "FOAM", 
  "MOUTHWASH",   "IMPLANT",   "MICROSPHERES"
];


const STRENGTH_UNITS = ["MG", "ML", "G", "MCG", "IU", "NG", "MMOL", "PERCENT"];

const PACK_SIZE_UNITS = [
  "TABLET", "CAPSULE", "ML", "VIAL", "AMPOULE", "SACHET", 
  "PATCH", "BOTTLE", "TUBE", "BLISTER" 
];

// Helper Components
const FormSection = ({ title, description, icon: Icon, children, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div 
        className={`px-6 py-4 bg-gray-50 border-b border-gray-200 ${collapsible ? 'cursor-pointer hover:bg-gray-100' : ''}`}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-[#225F91]" />}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#225F91]">{title}</h3>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          {collapsible && (
            <button type="button" className="text-gray-400 hover:text-gray-600">
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
};

const FormField = ({ label, required = false, error, help, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-900">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {help && (
      <p className="text-sm text-gray-500 flex items-start gap-1">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        {help}
      </p>
    )}
    {error && (
      <p className="text-sm text-red-600 flex items-center gap-1">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const Input = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2 border rounded-lg transition-colors focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-[#1ABA7F]'
    }`}
  />
);

const Select = ({ error, children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3 py-2 border rounded-lg transition-colors focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-[#1ABA7F]'
    }`}
  >
    {children}
  </select>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Main Component
export default function MedicationForm({ medication = {}, mode = "create", onSuccess }) {
  const router = useRouter();

  // Form State
  const [form, setForm] = useState({
    brandName: medication.brandName || "",
    brandDescription: medication.brandDescription || "",
    manufacturerId: medication.manufacturerId || "",
    form: medication.form?.toUpperCase() || "",
    pharmacopeia: medication.pharmacopeia || "",
    packSizeExpression: medication.packSizeExpression || "",
    packSizeUnit: medication.packSizeUnit?.toUpperCase() || "",
    nafdacCode: medication.nafdacCode || "",
    prescriptionRequired: medication.prescriptionRequired ?? false,
    manufacturerId: medication.manufacturerId || medication.Manufacturer?.id || "",
    imageUrl: medication.imageUrl || "",
    image: null,
  });

  // Field Errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Ingredients State
  const [ingredients, setIngredients] = useState(
    medication.Medication_MedicationIngredient?.map(mi => ({
      medicationIngredientId: mi.MedicationIngredient?.id || null,
      activeSubstanceId: mi.MedicationIngredient?.substanceId || "",
      strengthValue: mi.MedicationIngredient?.strengthValue || "",
      strengthUnit: mi.MedicationIngredient?.strengthUnit || "",
      perUnitValue: mi.MedicationIngredient?.perUnitValue || 1,
      perUnitType: mi.MedicationIngredient?.perUnitType || form.packSizeUnit || "ML",
    })) || [{ medicationIngredientId: null, activeSubstanceId: "", strengthValue: "", strengthUnit: "", perUnitValue: 1, perUnitType: "ML" }]
  );

  // Options State
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [activeSubstances, setActiveSubstances] = useState([]);
  const [medicationIngredients, setMedicationIngredients] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Effects
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [manufacturerRes, substanceRes, ingredientRes] = await Promise.all([
          fetchManufacturers({ limit: 100 }),
          fetchActiveSubstances({ limit: 100 }),
          fetchMedicationIngredients({ limit: 100 })
        ]);

        setManufacturerOptions(manufacturerRes.manufacturers || []);
        setActiveSubstances(substanceRes.activeSubstances || []);
        setMedicationIngredients(ingredientRes.medicationIngredients || []);
      } catch (error) {
        console.error("Failed to fetch options:", error);
      }
    };

    fetchOptions();
  }, []);

  // Validation
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'brandName':
        if (!value?.trim()) {
          errors.brandName = 'Brand name is required';
        } else if (value.length < 2) {
          errors.brandName = 'Brand name must be at least 2 characters';
        } else {
          delete errors.brandName;
        }
        break;
      case 'nafdacCode':
        if (!value?.trim()) {
          errors.nafdacCode = 'NAFDAC code is required';
        } else {
          delete errors.nafdacCode;
        }
        break;
      case 'packSizeExpression':
        if (!value?.trim()) {
          errors.packSizeExpression = 'Pack size is required';
        } else if (value.length > 50) {
          errors.packSizeExpression = 'Pack size must be 50 characters or less';
        } else {
          delete errors.packSizeExpression;
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
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setForm(prev => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Validate on change
    if (name !== 'image') {
      validateField(name, newValue);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, {
      medicationIngredientId: null,
      activeSubstanceId: "",
      strengthValue: "",
      strengthUnit: "",
      perUnitValue: 1,
      perUnitType: form.packSizeUnit || "",
    }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  // File upload handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files[0] && files[0].type.startsWith('image/')) {
      setForm(prev => ({ ...prev, image: files[0] }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: null }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  // Validate all fields
  const isValid = [
    validateField('brandName', form.brandName),
    validateField('nafdacCode', form.nafdacCode),
    validateField('packSizeExpression', form.packSizeExpression),
  ].every(Boolean);

  if (!isValid) {
    setLoading(false);
    setError('Please fix the form errors before submitting');
    return;
  }

  try {
    const formData = new FormData();

    // Required fields
    formData.append("brandName", form.brandName.trim());
    formData.append("nafdacCode", form.nafdacCode.trim());

    // Optional fields
    if (form.brandDescription?.trim()) formData.append("brandDescription", form.brandDescription.trim());
    if (form.form) formData.append("form", form.form);
    if (form.packSizeUnit) formData.append("packSizeUnit", form.packSizeUnit);
    if (form.packSizeExpression?.trim()) formData.append("packSizeExpression", form.packSizeExpression.trim());
    if (form.pharmacopeia) formData.append("pharmacopeia", form.pharmacopeia); 


    // Handle manufacturer
    if (form.manufacturerId) {
      formData.append("manufacturerId", String(form.manufacturerId));
    } else if (form.customManufacturerName?.trim()) {
      formData.append("manufacturerName", form.customManufacturerName.trim());
    } else {
      throw new Error("Manufacturer is required");
    }

    formData.append("prescriptionRequired", String(form.prescriptionRequired));

    if (form.image instanceof File) {
      formData.append("image", form.image);
    }

    // Validate ingredients
    const validIngredients = ingredients.filter(ing =>
      ing.medicationIngredientId || (ing.activeSubstanceId && ing.activeSubstanceId !== "")
    );

    if (validIngredients.length === 0) {
      throw new Error('At least one valid ingredient is required');
    }

    formData.append("ingredients", JSON.stringify(
      validIngredients.map((ing) => {
        if (ing.medicationIngredientId) {
          const existing = medicationIngredients.find(mi => mi.id === parseInt(ing.medicationIngredientId));
          if (!existing) throw new Error("Selected medication ingredient not found");

          return {
            activeSubstanceId: existing.substanceId,
            strengthValue: existing.strengthValue,
            strengthUnit: existing.strengthUnit,
            perUnitValue: existing.perUnitValue || 1,
            perUnitType: existing.perUnitType || form.packSizeUnit || null,
          };
        } else {
          return {
            activeSubstanceId: parseInt(ing.activeSubstanceId),
            strengthValue: parseFloat(ing.strengthValue),
            strengthUnit: ing.strengthUnit,
            perUnitValue: parseFloat(ing.perUnitValue || 1),
            perUnitType: ing.perUnitType || null,
          };
        }
      })
    ));

    // Submit
    if (mode === "edit") {
      await updateMedication(medication.id, formData);
    } else {
      await createMedication(formData);
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

// Render ingredient item
const renderIngredientItem = (ing, idx) => {
  const isExisting = !!ing.medicationIngredientId;
  const selectedExisting = isExisting
    ? medicationIngredients.find(mi => mi.id === parseInt(ing.medicationIngredientId))
    : null;

  // Error handling per ingredient
  const ingredientErrors = fieldErrors.ingredients?.[idx] || {};

  return (
    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Ingredient {idx + 1}</h4>
        {ingredients.length > 1 && (
          <button
            type="button"
            onClick={() => removeIngredient(idx)}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
            aria-label={`Remove ingredient ${idx + 1}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Existing ingredient selector */}
      <FormField label="Medication Ingredient">
        <AutocompleteInput
          value={medicationIngredients.find(mi => mi.id === ing.medicationIngredientId) || null}
          onChange={(selected) => {
            handleIngredientChange(idx, "medicationIngredientId", selected?.id || null);

            if (selected) {
              // Clear custom fields when an existing ingredient is selected
              handleIngredientChange(idx, "activeSubstanceId", "");
              handleIngredientChange(idx, "strengthValue", "");
              handleIngredientChange(idx, "strengthUnit", "");
              handleIngredientChange(idx, "perUnitValue", selected.perUnitValue || 1);
              handleIngredientChange(
                idx,
                "perUnitType",
                selected.perUnitType || form.packSizeUnit || ""
              );
            }
          }}
          fetchOptions={searchMedicationIngredients}
          placeholder="Type medication ingredient..."
          displayFn={(option) =>
            option.ActiveSubstance
              ? `${option.ActiveSubstance.name}${option.strengthValue ? ` - ${option.strengthValue}${option.strengthUnit || ''}` : ''}`
              : option.name
          }
          minChars={1} // allows search after 1 character
        />
      </FormField>


        {selectedExisting && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Selected Ingredient Details:</p>
            <div className="text-sm text-blue-700 mt-1">
              <p><strong>Active Substance:</strong> {selectedExisting.ActiveSubstance?.name}</p>
              <p><strong>Strength:</strong> {selectedExisting.strengthValue} {selectedExisting.strengthUnit}</p>
              <p><strong>Per Unit:</strong> {selectedExisting.perUnitValue} {selectedExisting.perUnitType}</p>
            </div>
          </div>
        )}

        {/* Custom ingredient fields */}
        {!isExisting && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Active Substance */}
            <FormField label="Active Substance" required error={ingredientErrors.activeSubstanceId}>
              <AutocompleteInput
                value={activeSubstances.find(a => a.id === ing.activeSubstanceId) || null}
                onChange={(selected) => handleIngredientChange(idx, "activeSubstanceId", selected?.id || null)}
                fetchOptions={searchActiveSubstances}
                placeholder="Type active substance..."
              />
            </FormField>

            {/* Strength */}
            <FormField label="Strength" required error={ingredientErrors.strengthValue}>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={ing.strengthValue}
                  onChange={(e) => handleIngredientChange(idx, "strengthValue", e.target.value)}
                  required
                  className="flex-1"
                />
                <Select
                  value={ing.strengthUnit}
                  onChange={(e) => handleIngredientChange(idx, "strengthUnit", e.target.value)}
                  required
                  className="w-20"
                >
                  <option value="">Unit</option>
                  {STRENGTH_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </Select>
              </div>
            </FormField>

            {/* Per Unit Value */}
            <FormField 
              label="Per Unit Value" 
              help="How much of this ingredient per unit (e.g., per tablet)"
              error={ingredientErrors.perUnitValue}
            >
              <Input
                type="number"
                step="0.01"
                min="1"
                value={ing.perUnitValue || 1}
                onChange={(e) => handleIngredientChange(idx, "perUnitValue", e.target.value)}
              />
            </FormField>

            {/* Per Unit Type */}
            <FormField label="Per Unit Type" error={ingredientErrors.perUnitType}>
              <Select
                value={ing.perUnitType || form.packSizeUnit || ""}
                onChange={(e) => handleIngredientChange(idx, "perUnitType", e.target.value)}
              >
                <option value="">Select unit type</option>
                {PACK_SIZE_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
};


  return (
    <div className="max-w-8xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection 
          title="Basic Information" 
          description="Enter the primary details about the medication"
          icon={Info}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField label="Brand Name" required error={fieldErrors.brandName}>
              <Input
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                error={fieldErrors.brandName}
                placeholder="Enter the commercial brand name"
              />
            </FormField>

            <FormField label="Manufacturer" error={fieldErrors.manufacturerId}>
              <AutocompleteInput
                value={
                  // If an existing manufacturer is selected
                  manufacturerOptions.find(m => m.id === form.manufacturerId) ||
                  // If a custom manufacturer is typed
                  (form.customManufacturerName ? { name: form.customManufacturerName } : null)
                }
                onChange={(selected) => {
                  if (selected?.id) {
                    // User selected an existing manufacturer
                    setForm(prev => ({
                      ...prev,
                      manufacturerId: selected.id,
                      customManufacturerName: "", // clear custom input
                    }));
                  }
                }}
                fetchOptions={searchManufacturers}
                placeholder="Type manufacturer name..."
                allowCustomInput={true}
                onCustomInput={(text) => {
                  setForm(prev => ({
                    ...prev,
                    manufacturerId: null,        // clear any selected existing manufacturer
                    customManufacturerName: text // store custom name
                  }));
                }}
                displayFn={(option) => option.name}
              />
            </FormField>



            <FormField label="Brand Description" help="Optional description of the medication">
              <textarea
                name="brandDescription"
                value={form.brandDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent resize-none"
                placeholder="Brief description of the medication"
              />
            </FormField>

           <FormField 
              label="NAFDAC Code" 
              required 
              error={fieldErrors.nafdacCode}
            >
              <Input
                name="nafdacCode"
                value={form.nafdacCode}
                onChange={handleChange}
                error={fieldErrors.nafdacCode}
                placeholder="e.g., A4-1234"
              />
            </FormField>

            <FormField label="Pharmacopeia (Optional)" error={fieldErrors.pharmacopeia}>
              <Select
                name="pharmacopeia"
                value={form.pharmacopeia}
                onChange={handleChange}
              >
                <option value="">Pharmacopeia</option>
                <option value="USP">USP</option>
                <option value="BP">BP</option>
                <option value="IP">IP</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>

 
          </div>
        </FormSection>

        {/* Product Specifications */}
        <FormSection 
          title="Product Specifications" 
          description="Define the physical form and packaging details"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FormField label="Dosage Form">
              <Select
                name="form"
                value={form.form}
                onChange={handleChange}
              >
                <option value="">Select form</option>
                {DOSAGE_FORMS.map(form => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </Select>
            </FormField>

             <FormField 
                label="Pack Size Quantity" 
                error={fieldErrors.packSizeExpression}
              >
                <Input
                  name="packSizeExpression"
                  type="text"
                  value={form.packSizeExpression}
                  onChange={handleChange}
                  error={fieldErrors.packSizeExpression}
                  placeholder="e.g., 10 x 10 or 100"
                />
              </FormField>

            <FormField label="Pack Size Unit">
              <Select
                name="packSizeUnit"
                value={form.packSizeUnit}
                onChange={handleChange}
              >
                <option value="">Select unit</option>
                {PACK_SIZE_UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="prescriptionRequired"
                checked={form.prescriptionRequired}
                onChange={handleChange}
                className="w-4 h-4 text-[#1ABA7F] border-gray-300 rounded focus:ring-[#1ABA7F]"
              />
              <span className="text-sm font-medium text-gray-900">
                Prescription Required
              </span>
              {form.prescriptionRequired && <Badge variant="warning">Prescription Only</Badge>}
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-7">
              Check if this medication requires a prescription to dispense
            </p>
          </div>
        </FormSection>


        {/* Ingredients */}
        <FormSection 
          title="Active Ingredients" 
          description="Define the active pharmaceutical ingredients and their concentrations"
        >
          <div className="space-y-4">
            {ingredients.map((ing, idx) => renderIngredientItem(ing, idx))}
            
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-2 px-4 py-2 border border-[#1ABA7F] text-[#1ABA7F] rounded-lg hover:bg-[#1ABA7F]/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Another Ingredient
            </button>
          </div>
        </FormSection>

                {/* Medication Image */}
        <FormSection title="Medication Image" description="Upload an image of the medication">
          <div className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive 
                  ? 'border-[#1ABA7F] bg-[#1ABA7F]/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setForm(prev => ({ ...prev, image: file }));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
         {form.image ? (
            // Case 1: User uploaded a new file
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(form.image)}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">{form.image.name}</p>
            </div>
          ) : form.imageUrl ? (
            // Case 2: Medication already has an image from DB
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={form.imageUrl}
                  alt="Medication"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, imageUrl: "" }))}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            // Case 3: No image at all → show placeholder
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">
                  Drop an image here, or click to select
                </p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          )}

            </div>
          </div>
        </FormSection>

        {/* Status Messages */}
        {(loading || error || success) && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {loading && (
              <div className="flex items-center gap-2 text-[#1ABA7F]">
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Saving medication...</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Medication {mode === 'edit' ? 'updated' : 'created'} successfully!</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#1ABA7F] text-white font-semibold rounded-lg hover:bg-[#159e6a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "edit" ? "Update Medication" : "Create Medication"}
          </button>
        </div>
      </form>
    </div>
  );
}