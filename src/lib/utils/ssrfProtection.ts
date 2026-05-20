const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254',
  'metadata.googleusercontent.com',
  'googleusercontent.com',
];

const ALLOWED_DOMAINS = new Set([
  'api.openai.com',
  'api.anthropic.com',
]);

export interface SSRFValidationResult {
  valid: boolean;
  error?: string;
}

export function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

export function isBlockedHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();
  return BLOCKED_HOSTNAMES.some((blocked) =>
    lowerHostname === blocked || lowerHostname.endsWith('.' + blocked)
  );
}

export function isAllowedDomain(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();
  return ALLOWED_DOMAINS.has(lowerHostname);
}

export function validateSSRF(urlString: string): SSRFValidationResult {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  const hostname = url.hostname;

  if (url.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are allowed' };
  }

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    if (isPrivateIP(hostname)) {
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
  }

  if (isBlockedHostname(hostname)) {
    return { valid: false, error: `Hostname '${hostname}' is blocked` };
  }

  if (!isAllowedDomain(hostname)) {
    return { valid: false, error: `Domain '${hostname}' is not in the allowlist` };
  }

  return { valid: true };
}

export function getAllowedDomains(): string[] {
  return Array.from(ALLOWED_DOMAINS);
}