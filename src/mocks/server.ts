import { setupServer } from 'msw/node';
import { handlers } from './handlers/wordpress';

export const server = setupServer(...handlers);