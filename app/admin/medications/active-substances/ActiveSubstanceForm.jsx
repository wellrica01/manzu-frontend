"use client";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { fetchGenericNames } from "../generic-names/api";

const SUBSTANCE_TYPES = [
  "BASE",
  "SALT",
  "ESTER",
  "HYDRATE",
  "COMPLEX",
  "ANHYDROUS",
  "AMORPHOUS",
  "PRODRUG",
  "ENANTIOMER",
  "POLYMORPH",
];

export default function ActiveSubstanceForm({ initialData = {}, onSubmit, loading = false, error = null }) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState(initialData?.type || SUBSTANCE_TYPES[0]);
  const [genericId, setGenericId] = useState(initialData?.genericId || "");
  const [genericOptions, setGenericOptions] = useState([]);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // fetch generic names safely
    fetchGenericNames()
      .then((res) => {
        if (isMounted) setGenericOptions(res?.genericNames || []);
      })
      .catch(() => {
        if (isMounted) setGenericOptions([]);
      });
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!type) {
      setFormError("Type is required");
      return;
    }
    if (!genericId) {
      setFormError("Generic Name is required");
      return;
    }

    try {
      await onSubmit({ name, type, genericId });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch (err) {
      setFormError(err?.message || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#225F91] mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Type *</label>
          <select
            value={type || ""}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
            required
          >
            {SUBSTANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#225F91] mb-1">Generic Name *</label>
          <select
            value={genericId || ""}
            onChange={(e) => setGenericId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-[#1ABA7F]/20 rounded-lg focus:border-[#1ABA7F] focus:outline-none"
            disabled={loading}
            required
          >
            <option value="">Select Generic Name</option>
            {genericOptions?.map((g) => (
              <option key={g.id} value={g.id}>
                {g?.name || "-"}
              </option>
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
