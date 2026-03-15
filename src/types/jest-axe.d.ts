import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R
    }
  }
}

declare module 'jest-axe' {
  export function axe(element?: Element | string): Promise<AxeResults>
  export const toHaveNoViolations: () => void
}

interface AxeResults {
  passes: AxeResult[]
  violations: AxeResult[]
  incomplete: AxeResult[]
}

interface AxeResult {
  id: string
  description: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null
  nodes: AxeNode[]
  any: unknown[]
  all: unknown[]
  tags: string[]
}

interface AxeNode {
  html: string
  target: string[]
  failureSummary?: string
}

export {}
