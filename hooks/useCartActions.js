'use client';
import { useState, useCallback } from "react";
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

    const isInCart = useCallback(
      (medicationId, pharmacyId) => {
        return (
          cart?.pharmacies?.some(
            (ph) =>
              ph.pharmacy.id === pharmacyId &&
              ph.items?.some((item) => item.medication.id === medicationId)
          ) || false
        );
      },
      [cart]
    );

  return {
    handleAddToCart,
    isInCart,
    isAddingToCart,
    lastAddedItem,
    openCartDialog,
    setOpenCartDialog,
  };
}
