import { useCallback, useState } from 'react';
import {
  useProduct,
  useAddToCart,
  type Product,
} from '@reactive-platform/commerce-hooks';

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
 * Combines product lookup (useProduct) with add-to-cart functionality.
 * Provides a unified interface for the scanning workflow.
 */
export function useProductScan(): ProductScanResult {
  const [sku, setSku] = useState<string | null>(null);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);

  // Product lookup
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProduct(sku ?? undefined);

  // Add to cart mutation
  const { mutateAsync: addToCart, isPending: isAddingToCart } = useAddToCart();

  const isLoading = isLoadingProduct || isAddingToCart;

  // Lookup product by SKU
  const lookup = useCallback(
    async (skuToLookup: string): Promise<Product | null> => {
      setError(null);
      setSku(skuToLookup);

      // Wait for the query to complete by returning a promise
      return new Promise((resolve) => {
        // Use a setTimeout to wait for the query to update
        const checkProduct = () => {
          if (product && !isLoadingProduct) {
            setLastScannedProduct(product);
            resolve(product);
          } else if (productError) {
            setError(productError as Error);
            resolve(null);
          } else if (!isLoadingProduct) {
            // Product not found
            setError(new Error(`Product not found: ${skuToLookup}`));
            resolve(null);
          } else {
            setTimeout(checkProduct, 100);
          }
        };
        checkProduct();
      });
    },
    [product, isLoadingProduct, productError]
  );

  // Scan and add to cart in one operation
  const scanAndAdd = useCallback(
    async (skuToScan: string): Promise<void> => {
      try {
        setError(null);
        setSku(skuToScan);

        // Wait for product to load
        await new Promise<void>((resolve, reject) => {
          const checkProduct = () => {
            if (product && !isLoadingProduct) {
              resolve();
            } else if (productError) {
              reject(productError);
            } else if (!isLoadingProduct && !product) {
              reject(new Error(`Product not found: ${skuToScan}`));
            } else {
              setTimeout(checkProduct, 100);
            }
          };
          checkProduct();
        });

        // Product loaded successfully, add to cart
        if (product) {
          setLastScannedProduct(product);
          await addToCart({
            sku: product.sku,
            quantity: 1,
          });
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      }
    },
    [product, isLoadingProduct, productError, addToCart]
  );

  return {
    lookup,
    scanAndAdd,
    isLoading,
    error: error || (productError as Error | null),
    lastScannedProduct,
  };
}
