import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi, getApiErrorMessage } from '../api/apiClient';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setError(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.getCart();
      setCart(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      // If 404 or empty cart, set clean empty structure
      if (err.response?.status === 404) {
        const emptyCart = { id: null, itemCount: 0, subtotal: 0, items: [] };
        setCart(emptyCart);
        return emptyCart;
      }
      const msg = getApiErrorMessage(err, 'Unable to load cart.');
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch cart whenever authentication state changes
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
      setError(null);
    }
  }, [user, fetchCart]);

  const addToCart = async (listingId) => {
    const res = await cartApi.addToCart(listingId);
    // Refresh cart to guarantee authoritative backend subtotal and item count
    await fetchCart();
    return res.data;
  };

  const removeFromCart = async (listingId) => {
    const res = await cartApi.removeFromCart(listingId);
    if (res.data) {
      setCart(res.data);
    } else {
      await fetchCart();
    }
    return res.data;
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    setCart({ id: cart?.id || null, itemCount: 0, subtotal: 0, items: [] });
  };

  const itemCount = cart?.itemCount ?? cart?.items?.length ?? 0;
  const subtotal = cart?.subtotal ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotal,
        loading,
        error,
        refreshCart: fetchCart,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
