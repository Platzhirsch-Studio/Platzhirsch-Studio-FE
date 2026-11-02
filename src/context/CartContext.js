"use client";
import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { trackWishlist } from "@/lib/analytics";
import WebVitals from "./WebVitals";

const CartContext = createContext();

// The Merkliste lives in localStorage("cart"). It is read through
// useSyncExternalStore instead of "useEffect → setState" (lint
// react-hooks/set-state-in-effect, R3-shell): the server and the hydration
// pass see the empty list, right after hydration React re-renders with the
// stored one – the same visible behaviour as before, without the cascading
// effect render. Writes go through the store, which saves on every change.
const EMPTY = [];
const listeners = new Set();
let items = EMPTY;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  // A corrupted value must not white-screen the whole site (no error
  // boundary sits above this provider) – drop it and start empty.
  try {
    const savedCart = localStorage.getItem("cart");
    const parsed = savedCart ? JSON.parse(savedCart) : null;
    if (Array.isArray(parsed)) items = parsed;
    else if (savedCart) localStorage.removeItem("cart");
  } catch {
    try {
      localStorage.removeItem("cart");
    } catch {
      /* storage unavailable */
    }
  }
}

const cartStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    load();
    return items;
  },
  getServerSnapshot() {
    return EMPTY;
  },
  /** Same contract as a useState setter: a value or an updater function. */
  set(next) {
    load();
    const value = typeof next === "function" ? next(items) : next;
    if (value === items) return;
    items = value;
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch {
      /* storage full or blocked: the list still works for this visit */
    }
    listeners.forEach((listener) => listener());
  },
};

export const CartProvider = ({ children }) => {
  const cartItems = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const setCartItems = cartStore.set;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "",
  });

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
  };
 
  const generateCartItemId = (item) => {
    return `${item.id}-${item.name}-${item.category || "default"}`;
  };
 
  const addToCart = (item) => {
    const cartItemId = generateCartItemId(item);
    const existingItemIndex = cartItems.findIndex((cartItem) => generateCartItemId(cartItem) === cartItemId);
 
    if (existingItemIndex >= 0) {
      showAlert("Dieses Produkt ist bereits in Ihrer Merkliste", "error");
    } else {
      // Add new item with quantity 1
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
      trackWishlist(item);
      showAlert("Produkt zur Merkliste hinzugefügt", "success");
    }
  };
 
  const removeFromCart = (itemId) => {
    // Try to find by full generated ID first
    const exists = cartItems.some((item) => generateCartItemId(item) === itemId);
    if (exists) {
      setCartItems((prevItems) => prevItems.filter((item) => generateCartItemId(item) !== itemId));
    } else {
      // Fall back to just matching product ID
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }
  };
 
  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
 
    setCartItems((prevItems) =>
      prevItems.map((item) => (generateCartItemId(item) === itemId ? { ...item, quantity: newQuantity } : item))
    );
  };
 
  // Batch versions (e.g. saving a whole collection at once) — functional
  // updates, since calling addToCart in a loop would overwrite itself.
  // add_to_wishlist for the pieces that are really new (worked out outside
  // the updater, which must stay pure).
  const addManyToCart = (items) => {
    const known = new Set(cartItems.map(generateCartItemId));
    const added = items.filter((item) => !known.has(generateCartItemId(item)));
    if (added.length) trackWishlist(added);
    setCartItems((prev) => {
      const ids = new Set(prev.map(generateCartItemId));
      const fresh = items.filter((item) => !ids.has(generateCartItemId(item)));
      return [...prev, ...fresh.map((item) => ({ ...item, quantity: 1 }))];
    });
  };

  const removeManyFromCart = (items) => {
    const ids = new Set(items.map(generateCartItemId));
    setCartItems((prev) => prev.filter((item) => !ids.has(generateCartItemId(item))));
  };

  const clearCart = () => {
    setCartItems([]);
  };
 
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
 
  const toggleCart = () => setIsCartOpen(!isCartOpen);
 
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        addManyToCart,
        removeManyFromCart,
        updateItemQuantity,
        clearCart,
        getTotalItems,
        isCartOpen,
        toggleCart,
        alert,
      }}
    >
      <WebVitals />
      {children}
    </CartContext.Provider>
  );
};
 
// Merkliste item image → <Image> src. Old "Produkte" items store a bare
// "/files/..." path (original backend → /cms); "Produkte New" items store the
// complete "/cmx/files/..." path (see ProductActions), used as-is.
export const wishlistImageSrc = (image) => {
  if (!image) return null;
  // /ezarri/: Ezarri mosaics (public/ezarri, Ezarri-Welt acceptance item 3).
  if (/^(\/cmx\/|\/cms\/|\/Images\/|\/ezarri\/|https?:)/.test(image)) return image;
  return `/cms${image}`;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
 
 
 
 

 