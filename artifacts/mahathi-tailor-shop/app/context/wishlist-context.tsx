'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Product } from '../data/products';
import { getCurrentSession, getInsforgeTable, INSFORGE_TABLES, isInsforgeConfigured } from '../../lib/insforge';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistItems: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_IDS_KEY = 'mahathi-wishlist';
const LOCAL_STORAGE_ITEMS_KEY = 'mahathi-wishlist-items';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Load initial wishlist from localStorage
  useEffect(() => {
    try {
      const savedIds = localStorage.getItem(LOCAL_STORAGE_IDS_KEY);
      const savedItems = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
      if (savedIds) {
        setWishlistIds(JSON.parse(savedIds));
      }
      if (savedItems) {
        setWishlistItems(JSON.parse(savedItems));
      }
    } catch {
      // ignore
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Save to localStorage & notify listeners
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_IDS_KEY, JSON.stringify(wishlistIds));
      localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(wishlistItems));
      localStorage.setItem('mahathi-wishlist-count', String(wishlistIds.length));
      window.dispatchEvent(new Event('mahathi-wishlist-updated'));
    } catch {
      // ignore
    }
  }, [wishlistIds, wishlistItems, isInitialized]);

  // 3. Track user session
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

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));

    if (userId && isInsforgeConfigured()) {
      void (async () => {
        try {
          await getInsforgeTable(INSFORGE_TABLES.wishlist)
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
        } catch {
          // ignore
        }
      })();
    }
  }, [userId]);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlistIds((prevIds) => {
      const exists = prevIds.includes(product.id);
      if (exists) {
        setWishlistItems((prevItems) => prevItems.filter((item) => item.id !== product.id));
        return prevIds.filter((id) => id !== product.id);
      } else {
        setWishlistItems((prevItems) => [...prevItems.filter((i) => i.id !== product.id), product]);
        return [...prevIds, product.id];
      }
    });

    if (userId && isInsforgeConfigured()) {
      void (async () => {
        try {
          const exists = wishlistIds.includes(product.id);
          if (exists) {
            await getInsforgeTable(INSFORGE_TABLES.wishlist)
              .delete()
              .eq('user_id', userId)
              .eq('product_id', product.id);
          } else {
            await getInsforgeTable(INSFORGE_TABLES.wishlist).insert({
              user_id: userId,
              product_id: product.id,
            });
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [userId, wishlistIds]);

  const contextValue = useMemo(
    () => ({
      wishlistIds,
      wishlistItems,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      count: wishlistIds.length,
    }),
    [wishlistIds, wishlistItems, toggleWishlist, isInWishlist, removeFromWishlist],
  );

  return <WishlistContext.Provider value={contextValue}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
