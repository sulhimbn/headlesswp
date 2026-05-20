import { test as base, expect } from '@playwright/test';

export interface TestFixtures {
  baseURL: string;
}

export const test = base.extend<TestFixtures>({
  baseURL: async ({}, use) => {
    await use('http://localhost:3000');
  },
});

export { expect };
