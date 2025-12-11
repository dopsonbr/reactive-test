export { productHandlers } from './products';
export { cartHandlers } from './cart';
export { customerHandlers } from './customers';
export { checkoutHandlers } from './checkout';

import { productHandlers } from './products';
import { cartHandlers } from './cart';
import { customerHandlers } from './customers';
import { checkoutHandlers } from './checkout';

export const allHandlers = [
  ...productHandlers,
  ...cartHandlers,
  ...customerHandlers,
  ...checkoutHandlers,
];
