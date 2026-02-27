export interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface EnvVariable {
  name: string
  required: boolean
  pattern?: RegExp
  defaultValue?: string
}

const REQUIRED_ENV_VARS: EnvVariable[] = [
  {
    name: 'NEXT_PUBLIC_WORDPRESS_API_URL',
    required: false,
    pattern: /^https?:\/\/.+/,
  },
  {
    name: 'NEXT_PUBLIC_WORDPRESS_URL',
    required: false,
    pattern: /^https?:\/\/.+/,
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: false,
    pattern: /^https?:\/\/.+/,
  },
]

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name]

    if (!value) {
      if (envVar.required) {
        errors.push(`Required environment variable ${envVar.name} is not set`)
      } else if (envVar.defaultValue) {
        warnings.push(
          `Environment variable ${envVar.name} not set, using default: ${envVar.defaultValue}`
        )
      }
      continue
    }

    if (envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(
        `Environment variable ${envVar.name} has invalid format: ${value}`
      )
    }
  }

  if (!process.env.NEXT_PUBLIC_WORDPRESS_API_URL) {
    warnings.push(
      `NEXT_PUBLIC_WORDPRESS_API_URL not set, using default fallback`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function logEnvironmentValidation(): void {
  const result = validateEnvironment()

  if (result.errors.length > 0) {
    console.error('[Environment] Validation failed:')
    result.errors.forEach((error) => console.error(`  - ${error}`))
  }

  if (result.warnings.length > 0) {
    console.warn('[Environment] Validation warnings:')
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`))
  }

  if (result.valid && result.errors.length === 0 && result.warnings.length === 0) {
    // Silent success - no need to log in production
  }
}
