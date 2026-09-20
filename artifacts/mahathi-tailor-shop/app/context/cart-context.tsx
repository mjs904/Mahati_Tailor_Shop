'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Product } from '../data/products';
import { getCurrentSession, getInsforgeTable, INSFORGE_TABLES, isInsforgeConfigured } from '../../lib/insforge';

export type CartItem = {
  id: string; // `${productId}-${size}`
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  size: string;
  quantity: number;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'mahathi_cart_v1';
const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 150;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Load initial cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Save to localStorage whenever items change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      // update legacy session counter for any other consumer
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      window.sessionStorage.setItem('mahathi-cart-count', String(totalCount));
      window.dispatchEvent(new Event('mahathi-cart-updated'));
    } catch {
      // ignore storage errors
    }
  }, [items, isInitialized]);

  // 3. Track user session & sync with InsForge cart_items
  useEffect(() => {
    if (!isInsforgeConfigured()) return;
    let mounted = true;

    const checkUser = async () => {
      try {
        const session = await getCurrentSession();
        if (mounted && session.user?.id) {
          setUserId(session.user.id);
        } else if (mounted) {
          setUserId(null);
        }
      } catch {
        if (mounted) setUserId(null);
      }
    };

    void checkUser();
    return () => {
      mounted = false;
    };
  }, []);

  // 4. Cart actions
  const addToCart = useCallback((product: Product, size = 'Free size', quantity = 1) => {
    setItems((currentItems) => {
      const chosenSize = size || product.sizes[0] || 'Free size';
      const itemKey = `${product.id}-${chosenSize}`;
      const existingIndex = currentItems.findIndex((item) => item.id === itemKey);

      if (existingIndex > -1) {
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: itemKey,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        size: chosenSize,
        quantity,
      };
      return [...currentItems, newItem];
    });

    // Remote sync if logged in
    if (userId && isInsforgeConfigured()) {
      void (async () => {
        try {
          setIsSyncing(true);
          await getInsforgeTable(INSFORGE_TABLES.cartItems).insert({
            user_id: userId,
            product_id: product.id,
            quantity,
          });
        } catch {
          // Keep local cart operational even if backend has constraint/RLS issues
        } finally {
          setIsSyncing(false);
        }
      })();
    }
  }, [userId]);

  const removeFromCart = useCallback((productId: string, size?: string) => {
    setItems((current) =>
      current.filter((item) => {
        if (size) {
          return !(item.productId === productId && item.size === size);
        }
        return item.productId !== productId;
      }),
    );

    if (userId && isInsforgeConfigured()) {
      void (async () => {
        try {
          await getInsforgeTable(INSFORGE_TABLES.cartItems)
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
        } catch {
          // ignore
        }
      })();
    }
  }, [userId]);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.productId === productId && item.size === size) {
          return { ...item, quantity };
        }
        return item;
      }),
    );

    if (userId && isInsforgeConfigured()) {
      void (async () => {
        try {
          await getInsforgeTable(INSFORGE_TABLES.cartItems)
            .update({ quantity })
            .eq('user_id', userId)
            .eq('product_id', productId);
        } catch {
          // ignore
        }
      })();
    }
  }, [removeFromCart, userId]);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.sessionStorage.setItem('mahathi-cart-count', '0');
      window.dispatchEvent(new Event('mahathi-cart-updated'));
    } catch {
      // ignore
    }

    if (userId && isInsforgeConfigured()) {
      void (async () => {
        try {
          await getInsforgeTable(INSFORGE_TABLES.cartItems)
            .delete()
            .eq('user_id', userId);
        } catch {
          // ignore
        }
      })();
    }
  }, [userId]);

  // Calculations
  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items],
  );

  const shipping = useMemo(
    () => (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE),
    [subtotal],
  );

  // Special offer as advertised: ₹300 off on orders over ₹2,499
  const discount = useMemo(
    () => (subtotal >= 2499 ? 300 : 0),
    [subtotal],
  );

  const total = useMemo(
    () => Math.max(0, subtotal + shipping - discount),
    [subtotal, shipping, discount],
  );

  const contextValue = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      shipping,
      discount,
      total,
      isSyncing,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      shipping,
      discount,
      total,
      isSyncing,
    ],
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
