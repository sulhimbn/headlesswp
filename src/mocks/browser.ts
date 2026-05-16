import { setupWorker } from 'msw/browser';
import { handlers } from './handlers/wordpress';

export const worker = setupWorker(...handlers);