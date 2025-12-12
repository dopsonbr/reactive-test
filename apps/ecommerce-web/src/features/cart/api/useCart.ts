import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest, ApiError } from '@reactive-platform/api-client';
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types';

export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

// GraphQL queries and mutations
const CART_QUERY = `
  query Cart($id: ID!) {
    cart(id: $id) {
      id
      storeNumber
      customerId
      products {
        sku
        name
        description
        unitPrice
        originalUnitPrice
        quantity
        availableQuantity
        imageUrl
        category
        lineTotal
        inStock
      }
      totals {
        subtotal
        discountTotal
        fulfillmentTotal
        taxTotal
        grandTotal
      }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_CART_MUTATION = `
  mutation CreateCart($input: CreateCartInput!) {
    createCart(input: $input) {
      id
      storeNumber
      products {
        sku
        name
        description
        unitPrice
        originalUnitPrice
        quantity
        availableQuantity
        imageUrl
        category
        lineTotal
        inStock
      }
      totals {
        subtotal
        discountTotal
        fulfillmentTotal
        taxTotal
        grandTotal
      }
      createdAt
      updatedAt
    }
  }
`;

const ADD_PRODUCT_MUTATION = `
  mutation AddProduct($cartId: ID!, $input: AddProductInput!) {
    addProduct(cartId: $cartId, input: $input) {
      id
      storeNumber
      customerId
      products {
        sku
        name
        description
        unitPrice
        originalUnitPrice
        quantity
        availableQuantity
        imageUrl
        category
        lineTotal
        inStock
      }
      totals {
        subtotal
        discountTotal
        fulfillmentTotal
        taxTotal
        grandTotal
      }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProduct($cartId: ID!, $sku: ID!, $input: UpdateProductInput!) {
    updateProduct(cartId: $cartId, sku: $sku, input: $input) {
      id
      storeNumber
      customerId
      products {
        sku
        name
        description
        unitPrice
        originalUnitPrice
        quantity
        availableQuantity
        imageUrl
        category
        lineTotal
        inStock
      }
      totals {
        subtotal
        discountTotal
        fulfillmentTotal
        taxTotal
        grandTotal
      }
      createdAt
      updatedAt
    }
  }
`;

const REMOVE_PRODUCT_MUTATION = `
  mutation RemoveProduct($cartId: ID!, $sku: ID!) {
    removeProduct(cartId: $cartId, sku: $sku) {
      id
      storeNumber
      customerId
      products {
        sku
        name
        description
        unitPrice
        originalUnitPrice
        quantity
        availableQuantity
        imageUrl
        category
        lineTotal
        inStock
      }
      totals {
        subtotal
        discountTotal
        fulfillmentTotal
        taxTotal
        grandTotal
      }
      createdAt
      updatedAt
    }
  }
`;

function getSessionValue(key: string, defaultValue: string): string {
  if (typeof sessionStorage === 'undefined') {
    return defaultValue;
  }
  return sessionStorage.getItem(key) || defaultValue;
}

function getStoreNumber(): number {
  return parseInt(getSessionValue('storeNumber', '1'), 10);
}

function getCartId(): string {
  if (typeof sessionStorage === 'undefined') {
    return 'server-cart';
  }
  let cartId = sessionStorage.getItem('cartId');
  if (!cartId) {
    cartId = crypto.randomUUID();
    sessionStorage.setItem('cartId', cartId);
  }
  return cartId;
}

function setCartId(id: string): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('cartId', id);
  }
}

export function useCart() {
  const cartId = getCartId();

  return useQuery({
    queryKey: cartKeys.detail(cartId),
    queryFn: async () => {
      try {
        const result = await graphqlRequest<{ cart: Cart | null }>(CART_QUERY, {
          id: cartId,
        });

        // Return null if cart doesn't exist - addProduct will create it with the correct cartId
        // Don't auto-create here because createCart generates a server-side ID which would
        // overwrite the client's cartId and break cart operations
        return result.cart;
      } catch (error) {
        // If cart not found, return null instead of creating a new one
        // addProduct will handle cart creation with the client's cartId
        if (error instanceof ApiError && error.status === 400) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 400) return false;
      return failureCount < 3;
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: async (item: AddToCartRequest) => {
      const result = await graphqlRequest<{ addProduct: Cart }>(
        ADD_PRODUCT_MUTATION,
        {
          cartId,
          input: { sku: item.sku, quantity: item.quantity },
        }
      );
      return result.addProduct;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: async ({ sku, quantity }: UpdateCartItemRequest) => {
      const result = await graphqlRequest<{ updateProduct: Cart }>(
        UPDATE_PRODUCT_MUTATION,
        {
          cartId,
          sku,
          input: { quantity },
        }
      );
      return result.updateProduct;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: async (sku: string) => {
      const result = await graphqlRequest<{ removeProduct: Cart }>(
        REMOVE_PRODUCT_MUTATION,
        { cartId, sku }
      );
      return result.removeProduct;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

// Re-export getCartId for use by subscription hook
export { getCartId };
