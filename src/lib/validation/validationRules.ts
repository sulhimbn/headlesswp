export const POST_STATUS_VALUES = ['publish', 'draft', 'private', 'future', 'pending'] as const;
export const POST_TYPE_VALUES = ['post', 'page'] as const;
export const MEDIA_TYPE_VALUES = ['image', 'video', 'file', 'application'] as const;

export const POST_VALIDATION_RULES = {
  status: {
    allowedValues: POST_STATUS_VALUES,
    default: 'publish',
  },
  type: {
    allowedValues: POST_TYPE_VALUES,
  },
  slug: {
    pattern: /^[a-z0-9-]+$/,
    minLength: 1,
    maxLength: 200,
  },
  date: {
    format: 'iso8601',
  },
} as const;

export const CATEGORY_VALIDATION_RULES = {
  slug: {
    pattern: /^[a-z0-9-]+$/,
    minLength: 1,
    maxLength: 200,
  },
  count: {
    min: 0,
  },
  parent: {
    min: 0,
  },
} as const;

export const TAG_VALIDATION_RULES = {
  slug: {
    pattern: /^[a-z0-9-]+$/,
    minLength: 1,
    maxLength: 200,
  },
  count: {
    min: 0,
  },
} as const;

export const MEDIA_VALIDATION_RULES = {
  media_type: {
    allowedValues: MEDIA_TYPE_VALUES,
  },
} as const;

export const AUTHOR_VALIDATION_RULES = {
  slug: {
    pattern: /^[a-z0-9-]+$/,
    minLength: 1,
    maxLength: 200,
  },
} as const;
