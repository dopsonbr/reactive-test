import { useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  productKeys,
  cartKeys,
  type Product,
  type CartScope,
  type Cart,
} from '@reactive-platform/commerce-hooks';
import { useKioskSession } from '../../session';

// Use empty string by default to leverage Vite proxy in development
const API_BASE = import.meta.env.VITE_PRODUCT_SERVICE_URL ?? '';
const CART_API_BASE = import.meta.env.VITE_CART_SERVICE_URL ?? '';

export interface ProductScanResult {
  lookup: (sku: string) => Promise<Product | null>;
  scanAndAdd: (sku: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  lastScannedProduct: Product | null;
}

/**
 * Hook for product lookup and adding scanned items to cart
 *
 * Uses imperative fetching for scan operations to avoid React Query
 * state synchronization issues. Each scan triggers a fresh API call.
 * Automatically creates a cart if one doesn't exist.
 *
 * @param cartScope - The cart scope with cartId and headers for add-to-cart operations
 */
export function useProductScan(cartScope: CartScope): ProductScanResult {
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track cart creation in progress to prevent duplicate creates
  const cartCreationPromise = useRef<Promise<Cart> | null>(null);

  const queryClient = useQueryClient();
  const { setCartId } = useKioskSession();

  // Create a new cart
  const createCart = useCallback(async (): Promise<Cart> => {
    const url = `${CART_API_BASE}/api/carts`;
    // Extract storeNumber from headers for the request body
    const storeNumber = parseInt(cartScope.headers['x-store-number'] || '0', 10);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...cartScope.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storeNumber }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create cart: ${response.statusText}`);
    }

    const cart: Cart = await response.json();
    // Update React Query cache
    queryClient.setQueryData(cartKeys.detail(cart.id), cart);
    // Update session with new cart ID
    setCartId(cart.id);
    return cart;
  }, [cartScope.headers, queryClient, setCartId]);

  // Get or create cart - ensures only one cart is created even with concurrent calls
  const getOrCreateCart = useCallback(async (): Promise<string> => {
    // If we already have a cartId in scope, use it
    if (cartScope.cartId) {
      return cartScope.cartId;
    }

    // If cart creation is already in progress, wait for it
    if (cartCreationPromise.current) {
      const cart = await cartCreationPromise.current;
      return cart.id;
    }

    // Create a new cart
    cartCreationPromise.current = createCart();
    try {
      const cart = await cartCreationPromise.current;
      return cart.id;
    } finally {
      cartCreationPromise.current = null;
    }
  }, [cartScope.cartId, createCart]);

  // Add item to cart
  const addItemToCart = useCallback(
    async (cartIdToUse: string, sku: string, quantity: number): Promise<Cart> => {
      const url = `${CART_API_BASE}/api/carts/${cartIdToUse}/products`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...cartScope.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sku, quantity }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add to cart: ${errorText || response.statusText}`);
      }

      const cart: Cart = await response.json();
      // Update React Query cache
      queryClient.setQueryData(cartKeys.detail(cartIdToUse), cart);
      return cart;
    },
    [cartScope.headers, queryClient]
  );

  // Fetch product directly (imperative, not reactive)
  const fetchProduct = useCallback(
    async (sku: string): Promise<Product> => {
      const url = `${API_BASE}/api/products/${sku}`;
      const response = await fetch(url, {
        headers: {
          ...cartScope.headers,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Product not found: ${sku}`);
        }
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const product = await response.json();
      // Update React Query cache so other components see the product
      queryClient.setQueryData(productKeys.detail(sku), product);
      return product;
    },
    [cartScope.headers, queryClient]
  );

  // Lookup product by SKU
  const lookup = useCallback(
    async (skuToLookup: string): Promise<Product | null> => {
      setError(null);
      setIsLoading(true);

      try {
        const product = await fetchProduct(skuToLookup);
        setLastScannedProduct(product);
        return product;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProduct]
  );

  // Scan and add to cart in one operation
  const scanAndAdd = useCallback(
    async (skuToScan: string): Promise<void> => {
      setError(null);
      setIsLoading(true);

      try {
        // Fetch the product first
        const product = await fetchProduct(skuToScan);
        setLastScannedProduct(product);

        // Get or create cart
        const cartIdToUse = await getOrCreateCart();

        // Add to cart
        await addItemToCart(cartIdToUse, product.sku, 1);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProduct, getOrCreateCart, addItemToCart]
  );

  return {
    lookup,
    scanAndAdd,
    isLoading,
    error,
    lastScannedProduct,
  };
}
