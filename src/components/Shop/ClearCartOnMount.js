"use client";
// Leert den Browser-Warenkorb, sobald die Bestellung bezahlt/reserviert ist –
// aber NUR, wenn dieser Browser genau diese Bestellung abgeschickt hat
// (Markierung aus ShopCart, src/lib/shop/pendingOrder.js). Ein später
// erneut geöffneter Bestätigungslink lässt einen neuen Warenkorb in Ruhe.
import { useEffect } from "react";
import { PENDING_ORDER_KEY, shouldClearFor } from "@/lib/shop/pendingOrder";
import { clearCart } from "./cartStore";

export default function ClearCartOnMount({ orderId }) {
  useEffect(() => {
    let raw = null;
    try {
      raw = window.localStorage.getItem(PENDING_ORDER_KEY);
    } catch {
      return;
    }
    if (!shouldClearFor(raw, orderId, Date.now())) return;
    clearCart();
    try {
      window.localStorage.removeItem(PENDING_ORDER_KEY);
    } catch {
      /* gesperrt */
    }
  }, [orderId]);
  return null;
}
