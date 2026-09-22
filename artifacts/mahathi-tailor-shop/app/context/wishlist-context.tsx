'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Product } from '../data/products';
import { getCurrentSession, getInsforgeTable, INSFORGE_TABLES, isInsforgeConfigured } from '../../lib/insforge';
import AuthModal from '../components/auth-modal';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistItems: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  count: number;
  isAuthenticated: boolean;
  requireAuth: (title?: string, message?: string, redirectPath?: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    redirectPath: string;
  }>({
    isOpen: false,
    title: 'Sign in required',
    message: 'Please sign in or create an account to save items to your wishlist.',
    redirectPath: '/wishlist',
  });

  // Track authenticated user session
  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        if (!isInsforgeConfigured()) {
          if (mounted) setUserId(null);
          return;
        }
        const session = await getCurrentSession();
        if (mounted) {
          setUserId(session.user?.id || null);
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

  // Sync wishlist from database when user logs in
  useEffect(() => {
    if (!userId || !isInsforgeConfigured()) {
      setWishlistIds([]);
      setWishlistItems([]);
      return;
    }

    let active = true;
    const fetchSavedWishlist = async () => {
      try {
        const { data } = await getInsforgeTable(INSFORGE_TABLES.wishlist)
          .select('product_id')
          .eq('user_id', userId);
        if (active && data) {
          const ids = data.map((r: any) => r.product_id).filter(Boolean);
          setWishlistIds(ids);
        }
      } catch {
        // ignore
      }
    };

    void fetchSavedWishlist();
    return () => {
      active = false;
    };
  }, [userId]);

  const requireAuth = useCallback(
    (title = 'Sign in required', message = 'Please sign in or create an account to continue.', redirectPath = '/account'): boolean => {
      if (userId) return true;
      setAuthModalConfig({
        isOpen: true,
        title,
        message,
        redirectPath,
      });
      return false;
    },
    [userId],
  );

  const isInWishlist = useCallback(
    (productId: string) => (userId ? wishlistIds.includes(productId) : false),
    [wishlistIds, userId],
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!userId) {
        requireAuth('Sign in required', 'Please sign in to manage your wishlist.', '/wishlist');
        return;
      }

      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      setWishlistItems((prev) => prev.filter((item) => item.id !== productId));

      if (isInsforgeConfigured()) {
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
    },
    [userId, requireAuth],
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (!userId) {
        requireAuth(
          'Save to your Wishlist',
          `Sign in or create an account to save "${product.name}" to your wishlist.`,
          '/wishlist',
        );
        return;
      }

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

      if (isInsforgeConfigured()) {
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
    },
    [userId, wishlistIds, requireAuth],
  );

  const contextValue = useMemo(
    () => ({
      wishlistIds,
      wishlistItems,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      count: wishlistIds.length,
      isAuthenticated: Boolean(userId),
      requireAuth,
    }),
    [wishlistIds, wishlistItems, toggleWishlist, isInWishlist, removeFromWishlist, userId, requireAuth],
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
      <AuthModal
        isOpen={authModalConfig.isOpen}
        onClose={() => setAuthModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={authModalConfig.title}
        message={authModalConfig.message}
        redirectPath={authModalConfig.redirectPath}
      />
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
