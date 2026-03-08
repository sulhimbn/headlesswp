export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
  errors: string[];
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
    pattern: /^https?:\/\/.+/,
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
      continue;
    }

    if (envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(`Environment variable ${envVar.name} has invalid format: ${value}`);
    }
  }

  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar.name];
    
    if (!value) {
      warnings.push(`${envVar.name} is not set (optional)`);
      continue;
    }

    if (envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(`Environment variable ${envVar.name} has invalid format: ${value}`);
    }
  }

  if (!process.env.NEXT_PUBLIC_WORDPRESS_API_URL) {
    warnings.push(`NEXT_PUBLIC_WORDPRESS_API_URL not set, using default fallback`);
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    warnings,
    errors: [...missing.map(m => `Required environment variable ${m} is not set`), ...errors],
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
    warnings: validation.warnings,
  };
}

export function assertEnvironment(): void {
  const validation = validateEnvironment();

  if (!validation.valid) {
    const errorParts: string[] = [];
    
    if (validation.missing.length > 0) {
      errorParts.push(`Missing required environment variables: ${validation.missing.join(', ')}`);
    }
    
    if (validation.errors.length > 0) {
      errorParts.push(`Invalid environment variables: ${validation.errors.join(', ')}`);
    }
    
    const errorMessage = [
      errorParts.join('\n'),
      '',
      'Please set the following environment variables:',
      ...REQUIRED_ENV_VARS.filter((v) => validation.missing.includes(v.name)).map(
        (v) => `  - ${v.name}: ${v.description}`
      ),
      '',
      'Add these variables to your .env.local file or deployment environment.',
    ].join('\n');

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
    // Silent success - no need to log in production
  }
}
