/**
 * @deprecated Use @/lib/config/envValidation instead
 * This module is maintained for backward compatibility and will be removed in a future version.
 */
import {
  validateEnvironment as configValidateEnvironment,
  logEnvironmentValidation as configLogEnvironmentValidation,
  type EnvValidationResult as ConfigEnvValidationResult,
  type EnvVariable,
} from '@/lib/config/envValidation';

export type EnvValidationResult = ConfigEnvValidationResult;
export type EnvVariable = EnvVariable;

const WRAPPER_OPTIONAL_VARS = [
  'NEXT_PUBLIC_WORDPRESS_API_URL',
  'NEXT_PUBLIC_WORDPRESS_URL',
  'NEXT_PUBLIC_SITE_URL',
];

export function validateEnvironment(): EnvValidationResult {
  const result = configValidateEnvironment();
  
  const errors: string[] = [...(result.errors || [])];
  const warnings: string[] = [...(result.warnings || [])];
  
  for (const name of WRAPPER_OPTIONAL_VARS) {
    const value = process.env[name];
    if (!value) {
      if (name.includes('WORDPRESS')) {
        warnings.push(`${name} not set, using default fallback`);
      }
    } else if (!/^https?:\/\/.+/.test(value)) {
      errors.push(`Environment variable ${name} has invalid format: ${value}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    missing: [],
    errors,
    warnings,
  };
}

export function logEnvironmentValidation(): void {
  configLogEnvironmentValidation();
}