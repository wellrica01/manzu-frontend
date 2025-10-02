'use client';
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./useApi";

export function useCartActions({ cart, fetchCart, guestId, t }) {
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [openCartDialog, setOpenCartDialog] = useState(false);

  const handleAddToCart = async (
    medicationId,
    pharmacyId,
    medicationName,
    quantity = 1
  ) => {
    const key = `${medicationId}-${pharmacyId}`;
    try {
      if (!medicationId || !pharmacyId) {
        throw new Error(t("errors.invalid_selection"));
      }

      setIsAddingToCart((prev) => ({ ...prev, [key]: true }));

      await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-id": guestId,
        },
        body: JSON.stringify({ medicationId, pharmacyId, quantity }),
      });

      setLastAddedItem(medicationName);
      setOpenCartDialog(true);

      await fetchCart();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAddingToCart((prev) => ({ ...prev, [key]: false }));
    }
  };

  const isInCart = (medicationId, pharmacyId) =>
    cart?.pharmacies?.some(
      (p) =>
        p.pharmacy.id === pharmacyId &&
        p.items?.some((i) => i.medication.id === medicationId)
    ) || false;

  return {
    handleAddToCart,
    isInCart,
    isAddingToCart,
    lastAddedItem,
    openCartDialog,
    setOpenCartDialog,
  };
}
