'use client';

import { useCallback, useEffect, useState } from 'react';
import { CatalogSnapshot, fetchCatalog } from '../data/products';

type CatalogState = CatalogSnapshot & {
  loading: boolean;
};

const initialState: CatalogState = {
  categories: [],
  products: [],
  error: null,
  loading: true,
};

export function useCatalog() {
  const [state, setState] = useState<CatalogState>(initialState);

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const catalog = await fetchCatalog();
      setState({ ...catalog, loading: false });
    } catch (error) {
      setState({
        categories: [],
        products: [],
        error,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    void reload();

    const handleCatalogUpdate = () => {
      void reload();
    };

    window.addEventListener('mahathi-catalog-updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('mahathi-catalog-updated', handleCatalogUpdate);
    };
  }, [reload]);

  return { ...state, reload };
}