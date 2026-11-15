import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.cart.get();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.warn('Failed to load cart:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, variantId = null, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to your cart.', 'info');
      return { success: false, requireAuth: true };
    }

    try {
      const res = await api.cart.addItem(productId, variantId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
        showToast('Added to your CartNest bag', 'success');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }
    try {
      const res = await api.cart.updateItem(itemId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
        return { success: true };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.cart.removeItem(itemId);
      if (res.success && res.data) {
        setCart(res.data);
        showToast('Item removed from cart', 'info');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.cart.clear();
      if (res.success && res.data) {
        setCart(res.data);
        return { success: true };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.totalItems || 0,
        subtotal: cart?.subtotal || 0,
        hasUnavailableItems: cart?.hasUnavailableItems || false,
        isLoading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
