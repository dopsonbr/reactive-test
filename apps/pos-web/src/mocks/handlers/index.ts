/**
 * MSW handlers index for POS E2E testing
 */

import { authHandlers } from './authHandlers';
import { productHandlers } from './productHandlers';
import { customerHandlers } from './customerHandlers';
import { cartHandlers } from './cartHandlers';
import { checkoutHandlers } from './checkoutHandlers';
import { orderHandlers } from './orderHandlers';

export const handlers = [
  ...authHandlers,
  ...productHandlers,
  ...customerHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...orderHandlers,
];

// Re-export individual handler groups for selective use
export {
  authHandlers,
  productHandlers,
  customerHandlers,
  cartHandlers,
  checkoutHandlers,
  orderHandlers,
};
