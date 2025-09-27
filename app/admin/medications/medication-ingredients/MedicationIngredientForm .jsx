"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fetchActiveSubstances } from "../active-substances/api";


const STRENGTH_UNITS = ["MG", "ML", "G", "MCG", "IU", "NG", "MMOL", "PERCENT"];


const PACK_SIZE_UNITS = [
  "TABLET", "CAPSULE", "ML", "VIAL", "AMPOULE", "SACHET", 
  "PATCH", "BOTTLE", "TUBE", "BLISTER" 
];

export default function MedicationIngredientForm({ initialData = null, onSubmit, loading, error }) {
  const [substanceId, setSubstanceId] = useState(initialData?.substanceId || "");
  const [strengthValue, setStrengthValue] = useState(initialData?.strengthValue || "");
  const [strengthUnit, setStrengthUnit] = useState(initialData?.strengthUnit || "");
  const [perUnitValue, setPerUnitValue] = useState(initialData?.perUnitValue || "");
  const [perUnitType, setPerUnitType] = useState(initialData?.perUnitType || "");
  const [activeSubstances, setActiveSubstances] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchActiveSubstances()
      .then((res) => setActiveSubstances(res.activeSubstances || []))
      .catch((err) => setFetchError(err.message));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      substanceId: Number(substanceId),
      strengthValue: strengthValue ? parseFloat(strengthValue) : null,
      strengthUnit: strengthUnit || null,
      perUnitValue: perUnitValue ? parseFloat(perUnitValue) : null,
      perUnitType: perUnitType || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fetchError && <p className="text-red-600">{fetchError}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Active Substance</label>
        <Select value={substanceId} onValueChange={setSubstanceId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select substance" />
          </SelectTrigger>
          <SelectContent>
            {activeSubstances.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Strength Value</label>
          <Input
            type="number"
            value={strengthValue}
            onChange={(e) => setStrengthValue(e.target.value)}
            placeholder="e.g., 500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Strength Unit</label>
          <Select value={strengthUnit} onValueChange={setStrengthUnit}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {STRENGTH_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Per Unit Value</label>
          <Input
            type="number"
            value={perUnitValue}
            onChange={(e) => setPerUnitValue(e.target.value)}
            placeholder="e.g., 1"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Per Unit Type</label>
          <Select value={perUnitType} onValueChange={setPerUnitType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select unit type" />
            </SelectTrigger>
            <SelectContent>
              {PACK_SIZE_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
