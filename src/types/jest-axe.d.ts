import '@testing-library/jest-dom'

declare module 'jest-axe' {
  export function axe(element?: HTMLElement, options?: object): Promise<AxeResults>
  export interface AxeResults {
    violations: AxeViolation[]
    passes: AxePass[]
  }
  export interface AxeViolation {
    id: string
    description: string
    help: string
    helpUrl: string
    impact: 'minor' | 'moderate' | 'serious' | 'critical' | null
    nodes: AxeNode[]
  }
  export interface AxePass {
    id: string
    description: string
    help: string
    helpUrl: string
    nodes: AxeNode[]
  }
  export interface AxeNode {
    html: string
    target: string[]
  }
  export const toHaveNoViolations: () => { 
    pass: boolean 
    message: () => string 
  }
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R
    }
  }
}

export {}
