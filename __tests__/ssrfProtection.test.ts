import {
  isPrivateIP,
  isBlockedHostname,
  isAllowedDomain,
  validateSSRF,
  getAllowedDomains,
} from '@/lib/utils/ssrfProtection';

describe('ssrfProtection', () => {
  describe('isPrivateIP', () => {
    it('should detect 127.x.x.x as private (loopback)', () => {
      expect(isPrivateIP('127.0.0.1')).toBe(true);
      expect(isPrivateIP('127.0.0.2')).toBe(true);
      expect(isPrivateIP('127.0.1.1')).toBe(true);
    });

    it('should detect 10.x.x.x as private', () => {
      expect(isPrivateIP('10.0.0.1')).toBe(true);
      expect(isPrivateIP('10.10.10.10')).toBe(true);
      expect(isPrivateIP('10.255.255.255')).toBe(true);
    });

    it('should detect 172.16.x - 172.31.x as private', () => {
      expect(isPrivateIP('172.16.0.1')).toBe(true);
      expect(isPrivateIP('172.31.255.255')).toBe(true);
      expect(isPrivateIP('172.15.0.1')).toBe(false);
      expect(isPrivateIP('172.32.0.1')).toBe(false);
    });

    it('should detect 192.168.x.x as private', () => {
      expect(isPrivateIP('192.168.0.1')).toBe(true);
      expect(isPrivateIP('192.168.255.255')).toBe(true);
    });

    it('should detect link-local addresses', () => {
      expect(isPrivateIP('169.254.0.1')).toBe(true);
      expect(isPrivateIP('169.254.169.254')).toBe(true);
    });

    it('should reject public IPs', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false);
      expect(isPrivateIP('1.1.1.1')).toBe(false);
      expect(isPrivateIP('142.250.185.78')).toBe(false);
    });
  });

  describe('isBlockedHostname', () => {
    it('should block localhost variations', () => {
      expect(isBlockedHostname('localhost')).toBe(true);
      expect(isBlockedHostname('LOCALHOST')).toBe(true);
      expect(isBlockedHostname('localhost.localdomain')).toBe(true);
    });

    it('should block cloud metadata endpoints', () => {
      expect(isBlockedHostname('169.254.169.254')).toBe(true);
      expect(isBlockedHostname('metadata.google.internal')).toBe(true);
      expect(isBlockedHostname('metadata.google')).toBe(true);
    });
  });

  describe('isAllowedDomain', () => {
    it('should allow OpenAI API domain', () => {
      expect(isAllowedDomain('api.openai.com')).toBe(true);
      expect(isAllowedDomain('API.OPENAI.COM')).toBe(true);
    });

    it('should allow Anthropic API domain', () => {
      expect(isAllowedDomain('api.anthropic.com')).toBe(true);
    });

    it('should reject other domains', () => {
      expect(isAllowedDomain('evil.com')).toBe(false);
      expect(isAllowedDomain('localhost')).toBe(false);
    });
  });

  describe('validateSSRF', () => {
    it('should validate allowed HTTPS URLs', () => {
      const result = validateSSRF('https://api.openai.com/v1/chat/completions');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject HTTP URLs', () => {
      const result = validateSSRF('http://api.openai.com/v1/chat/completions');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTPS');
    });

    it('should reject private IP URLs', () => {
      const result = validateSSRF('https://127.0.0.1/v1/chat/completions');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Private IP');
    });

    it('should reject internal hostnames', () => {
      const result = validateSSRF('https://localhost/api');
      expect(result.valid).toBe(false);
    });

    it('should reject disallowed domains', () => {
      const result = validateSSRF('https://evil.com/api');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('allowlist');
    });

    it('should reject invalid URLs', () => {
      const result = validateSSRF('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });
  });

  describe('getAllowedDomains', () => {
    it('should return list of allowed domains', () => {
      const domains = getAllowedDomains();
      expect(domains).toContain('api.openai.com');
      expect(domains).toContain('api.anthropic.com');
    });
  });
});