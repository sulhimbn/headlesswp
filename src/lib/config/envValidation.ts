export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
}

const REQUIRED_ENV_VARS: EnvVariable[] = [
  {
    name: 'NEXT_PUBLIC_WORDPRESS_URL',
    required: true,
    description: 'The public URL of the WordPress site',
  },
  {
    name: 'NEXT_PUBLIC_WORDPRESS_API_URL',
    required: true,
    description: 'The WordPress REST API URL',
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
  const warnings: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar.name]) {
      missing.push(envVar.name);
    }
  }

  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!process.env[envVar.name]) {
      warnings.push(`${envVar.name} is not set (optional)`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
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
    warnings: validation.warnings,
  };
}

export function assertEnvironment(): void {
  const validation = validateEnvironment();

  if (!validation.valid) {
    const missingList = validation.missing.join(', ');
    const errorMessage = [
      `Missing required environment variables: ${missingList}`,
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

  if (result.missing.length > 0) {
    console.error('[Environment] Validation failed:');
    result.missing.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('[Environment] Validation warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.valid && result.missing.length === 0 && result.warnings.length === 0) {
    // Silent success - no need to log in production
  }
}
