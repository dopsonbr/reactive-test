import { setupWorker } from 'msw/browser';
import { allHandlers } from '@reactive-platform/mock-handlers';

export const worker = setupWorker(...allHandlers);
