"use client";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { fetchCategories } from "../categories/api";
import { fetchChemicalClasses } from "../chemical-classes/api";
import { fetchTherapeuticClasses } from "../therapeutic-classes/api";

export default function GenericMedicationForm({ initialData = {}, onSubmit, loading = false, error = null }) {
  const [form, setForm] = useState({
    name: initialData.name || "",
    inn: initialData.inn || "",
    atcCode: initialData.atcCode || "",
    description: initialData.description || "",
    translations: initialData.translations || "",
    categoryIds: initialData.categoryIds || [],
    chemicalClassIds: initialData.chemicalClassIds || [],
    therapeuticClassIds: initialData.therapeuticClassIds || [],
  });
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [chemicalClassOptions, setChemicalClassOptions] = useState([]);
  const [therapeuticClassOptions, setTherapeuticClassOptions] = useState([]);

  useEffect(() => {
    fetchCategories({ limit: 100 }).then(res => setCategoryOptions(res.categories || []));
    fetchChemicalClasses({ limit: 100 }).then(res => setChemicalClassOptions(res.chemicalClasses || []));
    fetchTherapeuticClasses({ limit: 100 }).then(res => setTherapeuticClassOptions(res.therapeuticClasses || []));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleMultiSelectChange(e) {
    const { name, options } = e.target;
    const values = Array.from(options).filter(o => o.selected).map(o => Number(o.value));
    setForm((prev) => ({ ...prev, [name]: values }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    let translations = form.translations;
    try {
      translations = translations ? JSON.parse(translations) : undefined;
    } catch (e) {
      setFormError('Translations must be valid JSON');
      return;
    }
    try {
      await onSubmit({
        name: form.name,
        inn: form.inn || undefined,
        atcCode: form.atcCode || undefined,
        description: form.description || undefined,
        translations,
        categoryIds: form.categoryIds,
        chemicalClassIds: form.chemicalClassIds,
        therapeuticClassIds: form.therapeuticClassIds,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch (err) {
      setFormError(err.message || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">INN</label>
          <input
            name="inn"
            value={form.inn}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">ATC Code</label>
          <input
            name="atcCode"
            value={form.atcCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Description</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Translations (JSON/text, optional)</label>
          <input
            name="translations"
            value={form.translations}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Categories</label>
          <select
            name="categoryIds"
            multiple
            value={form.categoryIds}
            onChange={handleMultiSelectChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none h-32"
            disabled={loading}
          >
            {categoryOptions.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Chemical Classes</label>
          <select
            name="chemicalClassIds"
            multiple
            value={form.chemicalClassIds}
            onChange={handleMultiSelectChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none h-32"
            disabled={loading}
          >
            {chemicalClassOptions.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Therapeutic Classes</label>
          <select
            name="therapeuticClassIds"
            multiple
            value={form.therapeuticClassIds}
            onChange={handleMultiSelectChange}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none h-32"
            disabled={loading}
          >
            {therapeuticClassOptions.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-[#1ABA7F]">
          <Loader2 className="animate-spin w-5 h-5" /> Saving...
        </div>
      ) : formError || error ? (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          {formError || error}
        </div>
      ) : success ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          Success!
        </div>
      ) : null}
      <button
        type="submit"
        className="px-6 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition disabled:opacity-50"
        disabled={loading}
      >
        Save
      </button>
    </form>
  );
} 