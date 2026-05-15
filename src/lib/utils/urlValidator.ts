const PRIVATE_IP_PATTERNS = [
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.\d+\.\d+\.\d+$/,
  /^255\.255\.255\.255$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254',
  'metadata.google.internal',
];

const ALLOWED_PROTOCOLS = ['https:'];

export class SSRFProtectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFProtectionError';
  }
}

export function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

export function isBlockedHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();
  return BLOCKED_HOSTNAMES.some(
    (blocked) =>
      lowerHostname === blocked || lowerHostname.endsWith(`.${blocked}`)
  );
}

export async function validateExternalURL(urlString: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    throw new SSRFProtectionError('Invalid URL format');
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new SSRFProtectionError(
      `Protocol ${url.protocol} is not allowed. Only HTTPS is permitted.`
    );
  }

  if (isBlockedHostname(url.hostname)) {
    throw new SSRFProtectionError(
      `Hostname ${url.hostname} is blocked for security reasons.`
    );
  }

  if (isPrivateIP(url.hostname)) {
    throw new SSRFProtectionError(
      `IP address ${url.hostname} is not allowed. Private IPs are blocked.`
    );
  }

  try {
    const dnsResult = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(url.hostname)}&type=A`,
      { signal: AbortSignal.timeout(3000) }
    );
    const dnsData = await dnsResult.json();

    if (dnsData.Answer) {
      for (const answer of dnsData.Answer) {
        if (answer.type === 1 && isPrivateIP(answer.data)) {
          throw new SSRFProtectionError(
            `Resolved IP ${answer.data} for ${url.hostname} is a private IP.`
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof SSRFProtectionError) {
      throw error;
    }
  }

  return url;
}

export async function validateExternalFetch(
  urlString: string,
  options?: RequestInit
): Promise<typeof fetch> {
  await validateExternalURL(urlString)

  return async function (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> {
    const finalInput = typeof input === 'string' ? input : input.toString();
    await validateExternalURL(finalInput);
    return fetch(finalInput, { ...options, ...init });
  };
}