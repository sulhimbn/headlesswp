/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toSatisfySchemaInApiSpec(schemaName: string): R
      toSatisfyApiSpec(): R
    }
  }
}

export {}
