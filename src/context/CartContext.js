"use client";
import { createContext, useContext, useState, useEffect } from "react";
 
const CartContext = createContext();
 
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [cartLoaded, setCartLoaded] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      setCartLoaded(true);
    }
  }, []);
 
  // Save to localStorage ONLY after load
  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, cartLoaded]);
 
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
      showAlert("Dieses Produkt ist bereits in Ihrer Markenliste", "error");
    } else {
      // Add new item with quantity 1
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
      showAlert("Produkt erfolgreich zur Markenliste hinzugefügt", "success");
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
        updateItemQuantity,
        clearCart,
        getTotalItems,
        isCartOpen,
        toggleCart,
        alert,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
 
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
 
 
 
 

 