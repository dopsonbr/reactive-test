/**
 * MSW browser worker setup for POS E2E testing
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
