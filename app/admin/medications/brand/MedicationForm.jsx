"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { fetchManufacturers } from "../manufacturers/api";
import { fetchActiveSubstances } from "../active-substances/api";
import { fetchMedicationIngredients } from "../medication-ingredients/api";
import { createMedication, updateMedication } from "./api";

// Constants
const DOSAGE_FORMS = [
  "TABLET", "CAPSULE", "CAPLET", "SYRUP", "INJECTION", "CREAM", "OINTMENT", 
  "GEL", "SUSPENSION", "POWDER", "SUPPOSITORY", "EYE_DROP", "EAR_DROP", 
  "DROPS", "NASAL_SPRAY", "INHALER", "PATCH", "LOZENGE", "EFFERVESCENT"
];

const STRENGTH_UNITS = ["MG", "ML", "G", "MCG", "IU", "NG", "MMOL", "PERCENT"];


const PACK_SIZE_UNITS = [
  "TABLET", "CAPSULE", "ML", "VIAL", "AMPOULE", "SACHET", 
  "PATCH", "BOTTLE", "TUBE", "BLISTER" 
];



// Main Component
export default function MedicationForm({ medication = {}, mode = "create", onSuccess }) {
  const router = useRouter();

  // Form State
const [form, setForm] = useState({
  brandName: medication.brandName || "",
  brandDescription: medication.brandDescription || "",
  manufacturerId: medication.manufacturerId || "",
  form: medication.form || "",
  packSizeQuantity: medication.packSizeQuantity || "",
  packSizeUnit: medication.packSizeUnit || "",
  nafdacCode: medication.nafdacCode || "",
  prescriptionRequired: medication.prescriptionRequired ?? false,
  imageUrl: medication.imageUrl || "",
  image: null, // File object
});

  // Ingredients State
  const [ingredients, setIngredients] = useState(
    medication.Medication_MedicationIngredient?.map(mi => ({
      medicationIngredientId: mi.MedicationIngredient?.id || null,
      activeSubstanceId: mi.MedicationIngredient?.substanceId || "",
      strengthValue: mi.MedicationIngredient?.strengthValue || "",
      strengthUnit: mi.MedicationIngredient?.strengthUnit || "",
      perUnitValue: mi.MedicationIngredient?.perUnitValue || 1,
      perUnitType: mi.MedicationIngredient?.perUnitType || form.packSizeUnit || "",
    })) || []
  );

  // Options State
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [activeSubstances, setActiveSubstances] = useState([]);
  const [medicationIngredients, setMedicationIngredients] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Effects
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [ manufacturerRes, substanceRes, ingredientRes] = await Promise.all([
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

  // Event Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  try {
    const formData = new FormData();

    // Required fields - ensure they're not empty
    if (!form.brandName || !form.nafdacCode) {
      throw new Error('Brand name and NAFDAC code are required');
    }

    formData.append("brandName", form.brandName.trim());
    formData.append("nafdacCode", form.nafdacCode.trim());

    // Optional strings - only append if they have values
    if (form.brandDescription?.trim()) {
      formData.append("brandDescription", form.brandDescription.trim());
    }
    if (form.fullName?.trim()) {
      formData.append("fullName", form.fullName.trim());
    }
    if (form.form) {
      formData.append("form", form.form);
    }
    if (form.packSizeUnit) {
      formData.append("packSizeUnit", form.packSizeUnit);
    }
    
    // Numeric fields - only append if they have values
    if (form.packSizeQuantity) {
      formData.append("packSizeQuantity", String(form.packSizeQuantity));
    }
    if (form.manufacturerId) {
      formData.append("manufacturerId", String(form.manufacturerId));
    }

    // Boolean - always append
    formData.append("prescriptionRequired", String(form.prescriptionRequired));

    // Image file
    if (form.image instanceof File) {
      formData.append("image", form.image);
    }

    // Ingredients - validate before sending
    if (!ingredients || ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    // Filter out incomplete ingredients
    const validIngredients = ingredients.filter(ing => 
      ing.medicationIngredientId || (ing.activeSubstanceId && ing.activeSubstanceId !== "")
    );

    if (validIngredients.length === 0) {
      throw new Error('At least one valid ingredient with active substance is required');
    }

formData.append("ingredients", JSON.stringify(
  validIngredients.map((ing) => {
    if (ing.medicationIngredientId) {
      // Decode existing ingredient from medicationIngredients list
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
      // Manual ingredient
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


    // Call the API
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


  // Render Helpers
  const renderTextField = (name, label, required = false, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-[#225F91] mb-1">
        {label} {required && "*"}
      </label>
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
      />
    </div>
  );

  const renderSelectField = (name, label, options, required = false) => (
    <div>
      <label className="block text-sm font-medium text-[#225F91] mb-1">
        {label} {required && "*"}
      </label>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );

  const renderCheckboxField = (name, label) => (
    <div className="flex items-center gap-2 mt-6">
      <input
        type="checkbox"
        name={name}
        checked={form[name]}
        onChange={handleChange}
        id={name}
        className="h-4 w-4 border-gray-300 rounded"
      />
      <label htmlFor={name} className="text-sm text-[#225F91]">
        {label}
      </label>
    </div>
  );

  const renderStatusMessage = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-[#1ABA7F]">
          <Loader2 className="animate-spin w-5 h-5" />
          Saving...
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      );
    }
    
    if (success) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          Success!
        </div>
      );
    }
    
    return null;
  };

 const renderIngredientsSection = () => (
  <div className="space-y-2">
    <h3 className="font-semibold text-[#225F91]">Ingredients</h3>
    {ingredients.map((ing, idx) => {
      const isExisting = !!ing.medicationIngredientId; // if selected, treat as existing
      return (
        <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          {/* Existing Ingredient Dropdown */}
          <select
            value={ing.medicationIngredientId || ""}
            onChange={(e) => {
              const val = e.target.value;
              handleIngredientChange(idx, "medicationIngredientId", val);
              if (val) {
                // Clear fallback values if existing ingredient selected
                handleIngredientChange(idx, "activeSubstanceId", "");
                handleIngredientChange(idx, "strengthValue", "");
                handleIngredientChange(idx, "strengthUnit", "");
                handleIngredientChange(idx, "perUnitValue", 1);
                handleIngredientChange(idx, "perUnitType", form.packSizeUnit || "");
              }
            }}
            className="px-2 py-1 border rounded"
          >
            <option value="">Select existing ingredient</option>
            {medicationIngredients.map(mi => (
              <option key={mi.id} value={mi.id}>
                {mi.ActiveSubstance.name} - {mi.strengthValue}{mi.strengthUnit}
              </option>
            ))}
          </select>

          {/* Fallback Inputs: only show if no existing ingredient selected */}
          {!isExisting && (
            <>
              <select
                value={ing.activeSubstanceId}
                onChange={(e) => handleIngredientChange(idx, "activeSubstanceId", e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="">Select Active Substance</option>
                {activeSubstances.map(as => (
                  <option key={as.id} value={as.id}>{as.name}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Strength"
                value={ing.strengthValue}
                onChange={(e) => handleIngredientChange(idx, "strengthValue", e.target.value)}
                className="px-2 py-1 border rounded"
              />

              <select
                value={ing.strengthUnit}
                onChange={(e) => handleIngredientChange(idx, "strengthUnit", e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="">Unit</option>
                {STRENGTH_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Per Unit Value"
                value={ing.perUnitValue || 1}
                onChange={(e) => handleIngredientChange(idx, "perUnitValue", e.target.value)}
                className="px-2 py-1 border rounded"
                min={1}
              />

              <select
                value={ing.perUnitType || form.packSizeUnit || ""}
                onChange={(e) => handleIngredientChange(idx, "perUnitType", e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="">Unit Type</option>
                {PACK_SIZE_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </>
          )}

          <button
            type="button"
            onClick={() => removeIngredient(idx)}
            className="text-red-500 font-bold"
          >
            Remove
          </button>
        </div>
      );
    })}

    <button
      type="button"
      onClick={addIngredient}
      className="px-3 py-1 bg-[#225F91] text-white rounded"
    >
      Add Ingredient
    </button>
  </div>
);


  // Main Render
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Basic Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderTextField("brandName", "Brand Name", true)}
        
        {renderTextField("brandDescription", "Brand Description")}
                
        {renderSelectField("manufacturerId", "Manufacturer",
          manufacturerOptions.map(m => ({ value: m.id, label: m.name })))}
        
        {renderSelectField("form", "Form", DOSAGE_FORMS)}
                
        {renderTextField("packSizeQuantity", "Pack Size Quantity", false, "number")}
        
        {renderSelectField("packSizeUnit", "Pack Size Unit", PACK_SIZE_UNITS)}
                
      </div>

      {/* Regulatory Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderTextField("nafdacCode", "NAFDAC Code")}
                
        {renderCheckboxField("prescriptionRequired", "Prescription Required")}        
        
      </div>

      {/* Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">                 
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">
            Medication Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setForm(prev => ({ ...prev, image: file })); // store the File object
            }}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
          />
         {form.image && (
            <img
              src={URL.createObjectURL(form.image)}
              alt="Preview"
              className="mt-2 w-32 h-32 object-contain border"
            />
          )}

        </div>

      </div>

      {/* Ingredients Section */}
      {renderIngredientsSection()}

      {/* Status Message */}
      {renderStatusMessage()}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50"
      >
        {mode === "edit" ? "Update Medication" : "Create Medication"}
      </button>
    </form>
  );
}