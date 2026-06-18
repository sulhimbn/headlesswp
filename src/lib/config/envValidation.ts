export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
  warnings: string[];
}

export interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  pattern?: RegExp;
  defaultValue?: string;
}

const REQUIRED_ENV_VARS: EnvVariable[] = [
  {
    name: 'NEXT_PUBLIC_WORDPRESS_URL',
    required: true,
    description: 'The public URL of the WordPress site',
    pattern: /^https?:\/\/.+/,
  },
  {
    name: 'NEXT_PUBLIC_WORDPRESS_API_URL',
    required: true,
    description: 'The WordPress REST API URL',
    pattern: /^https?:\/\/.+/,
  },
];

const OPTIONAL_ENV_VARS: EnvVariable[] = [
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: false,
    description: 'The public URL of this Next.js site',
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL_WWW',
    required: false,
    description: 'The www URL of this Next.js site',
  },
  {
    name: 'NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS',
    required: false,
    description: 'Enable personalized recommendations feature',
  },
  {
    name: 'NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS',
    required: false,
    description: 'Enable recommendation analytics feature',
  },
  {
    name: 'SKIP_RETRIES',
    required: false,
    description: 'Skip retries for API requests',
  },
];

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value) {
      missing.push(envVar.name);
    } else if (envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(
        `Environment variable ${envVar.name} has invalid format: ${value}`
      );
    }
  }

  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value) {
      if (envVar.defaultValue) {
        warnings.push(
          `Environment variable ${envVar.name} not set, using default: ${envVar.defaultValue}`
        );
      } else {
        warnings.push(`${envVar.name} is not set (optional)`);
      }
    } else if (envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(
        `Environment variable ${envVar.name} has invalid format: ${value}`
      );
    }
  }

  if (!process.env.NEXT_PUBLIC_WORDPRESS_API_URL) {
    warnings.push(
      `NEXT_PUBLIC_WORDPRESS_API_URL not set, using default fallback`
    );
  }

  const allMissing = [...missing];
  if (!process.env.NEXT_PUBLIC_WORDPRESS_URL) {
    allMissing.push('NEXT_PUBLIC_WORDPRESS_URL');
  }
  if (!process.env.NEXT_PUBLIC_WORDPRESS_API_URL) {
    allMissing.push('NEXT_PUBLIC_WORDPRESS_API_URL');
  }

  return {
    valid: allMissing.length === 0 && errors.length === 0,
    missing: allMissing,
    errors,
    warnings,
  };
}

export function getEnvironmentStatus() {
  const validation = validateEnvironment();

  return {
    valid: validation.valid,
    timestamp: new Date().toISOString(),
    required: REQUIRED_ENV_VARS.map((env) => ({
      name: env.name,
      required: env.required,
      description: env.description,
      value: process.env[env.name] ? '***SET***' : 'NOT_SET',
    })),
    optional: OPTIONAL_ENV_VARS.map((env) => ({
      name: env.name,
      required: env.required,
      description: env.description,
      value: process.env[env.name] ? '***SET***' : 'NOT_SET',
    })),
    missing: validation.missing,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

export function assertEnvironment(): void {
  const validation = validateEnvironment();

  if (!validation.valid) {
    const missingList = validation.missing.join(', ');
    const errorList = validation.errors.join(', ');
    const errorMessage = [
      validation.missing.length > 0 ? `Missing required environment variables: ${missingList}` : '',
      validation.errors.length > 0 ? `Invalid environment variables: ${errorList}` : '',
      '',
      'Please set the following environment variables:',
      ...REQUIRED_ENV_VARS.filter((v) => validation.missing.includes(v.name)).map(
        (v) => `  - ${v.name}: ${v.description}`
      ),
      '',
      'Add these variables to your .env.local file or deployment environment.',
    ].filter(Boolean).join('\n');

    throw new Error(errorMessage);
  }
}

export function logEnvironmentValidation(): void {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('[Environment] Validation failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('[Environment] Validation warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.valid && result.errors.length === 0 && result.warnings.length === 0) {
    return;
  }
}
