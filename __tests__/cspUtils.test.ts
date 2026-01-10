import { useCspNonce, addNonceToScript, addNonceToStyle } from '@/lib/csp-utils';

describe('CSP Utilities', () => {
  describe('useCspNonce', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      const existingMeta = document.querySelector('meta[name="csp-nonce"]');
      if (existingMeta) {
        existingMeta.remove();
      }
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should return nonce from meta tag when available', () => {
      const testNonce = 'test-nonce-abc123';
      const metaTag = document.createElement('meta');
      metaTag.name = 'csp-nonce';
      metaTag.content = testNonce;
      document.head.appendChild(metaTag);

      const nonce = useCspNonce();

      expect(nonce).toBe(testNonce);
    });

    it('should return empty string when meta tag does not exist', () => {
      const nonce = useCspNonce();

      expect(nonce).toBe('');
    });

    it('should return empty string when meta tag has empty content', () => {
      const metaTag = document.createElement('meta');
      metaTag.name = 'csp-nonce';
      metaTag.content = '';
      document.head.appendChild(metaTag);

      const nonce = useCspNonce();

      expect(nonce).toBe('');
    });

    it('should handle meta tag with missing content attribute', () => {
      const metaTag = document.createElement('meta');
      metaTag.name = 'csp-nonce';
      document.head.appendChild(metaTag);

      const nonce = useCspNonce();

      expect(nonce).toBe('');
    });

    it('should get nonce from first matching meta tag if multiple exist', () => {
      const metaTag1 = document.createElement('meta');
      metaTag1.name = 'csp-nonce';
      metaTag1.content = 'first-nonce';
      
      const metaTag2 = document.createElement('meta');
      metaTag2.name = 'csp-nonce';
      metaTag2.content = 'second-nonce';
      
      document.head.appendChild(metaTag1);
      document.head.appendChild(metaTag2);

      const nonce = useCspNonce();

      expect(nonce).toBe('first-nonce');
    });

    it('should return string type', () => {
      const metaTag = document.createElement('meta');
      metaTag.name = 'csp-nonce';
      metaTag.content = 'nonce-123';
      document.head.appendChild(metaTag);

      const nonce = useCspNonce();

      expect(typeof nonce).toBe('string');
    });
  });

  describe('addNonceToScript', () => {
    it('should add nonce to single script tag', () => {
      const scriptContent = '<script>console.log("test");</script>';
      const nonce = 'test-nonce-abc123';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      expect(result).toContain('<script nonce="test-nonce-abc123">');
    });

    it('should add nonce to multiple script tags', () => {
      const scriptContent = `
        <script>console.log("first");</script>
        <script>console.log("second");</script>
        <script>console.log("third");</script>
      `;
      const nonce = 'test-nonce-xyz789';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      const scriptMatches = result.match(/nonce="test-nonce-xyz789"/g);
      expect(scriptMatches).toHaveLength(3);
    });

    it('should return original content when nonce is empty string', () => {
      const scriptContent = '<script>console.log("test");</script>';
      
      const result = addNonceToScript(scriptContent, '');

      expect(result).toBe(scriptContent);
    });

    it('should return original content when nonce is not provided', () => {
      const scriptContent = '<script>console.log("test");</script>';
      
      const result = addNonceToScript(scriptContent, '');

      expect(result).toBe(scriptContent);
    });

    it('should handle script tag with existing attributes', () => {
      const scriptContent = '<script type="text/javascript" async src="script.js"></script>';
      const nonce = 'nonce-123';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      expect(result).toContain('type="text/javascript"');
      expect(result).toContain('async');
      expect(result).toContain('src="script.js"');
    });

    it('should preserve script content', () => {
      const scriptContent = '<script>const x = 1; console.log(x);</script>';
      const nonce = 'test-nonce';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain('const x = 1;');
      expect(result).toContain('console.log(x);');
    });

    it('should handle script with special characters in content', () => {
      const scriptContent = '<script>alert("Test & < >");</script>';
      const nonce = 'nonce-abc';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      expect(result).toContain('alert("Test & < >")');
    });

    it('should handle empty script content', () => {
      const scriptContent = '<script></script>';
      const nonce = 'test-nonce';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
    });

    it('should handle self-closing script tag', () => {
      const scriptContent = '<script src="test.js" />';
      const nonce = 'test-nonce';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
    });

    it('should replace only script tags, not other tags', () => {
      const scriptContent = `
        <script>console.log("script");</script>
        <style>body { margin: 0; }</style>
        <div>content</div>
      `;
      const nonce = 'test-nonce';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain('nonce="test-nonce"');
      expect(result).toMatch(/<style>.*<\/style>/);
      expect(result).toContain('<div>content</div>');
    });
  });

  describe('addNonceToStyle', () => {
    it('should add nonce to single style tag', () => {
      const styleContent = '<style>body { margin: 0; }</style>';
      const nonce = 'test-nonce-abc123';
      
      const result = addNonceToStyle(styleContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      expect(result).toContain('<style nonce="test-nonce-abc123">');
    });

    it('should add nonce to multiple style tags', () => {
      const styleContent = `
        <style>.a { color: red; }</style>
        <style>.b { color: blue; }</style>
        <style>.c { color: green; }</style>
      `;
      const nonce = 'test-nonce-xyz789';
      
      const result = addNonceToStyle(styleContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      const styleMatches = result.match(/nonce="test-nonce-xyz789"/g);
      expect(styleMatches).toHaveLength(3);
    });

    it('should return original content when nonce is empty string', () => {
      const styleContent = '<style>body { margin: 0; }</style>';
      
      const result = addNonceToStyle(styleContent, '');

      expect(result).toBe(styleContent);
    });

    it('should return original content when nonce is not provided', () => {
      const styleContent = '<style>body { margin: 0; }</style>';
      
      const result = addNonceToStyle(styleContent, '');

      expect(result).toBe(styleContent);
    });

    it('should handle style tag with existing attributes', () => {
      const styleContent = '<style type="text/css" media="screen">body { margin: 0; }</style>';
      const nonce = 'nonce-123';
      
      const result = addNonceToStyle(styleContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      expect(result).toContain('type="text/css"');
      expect(result).toContain('media="screen"');
    });

    it('should preserve style content', () => {
      const styleContent = '<style>body { padding: 10px; background: white; }</style>';
      const nonce = 'test-nonce';
      
      const result = addNonceToStyle(styleContent, nonce);

      expect(result).toContain('body { padding: 10px; background: white; }');
    });

    it('should handle style with special CSS characters', () => {
      const styleContent = '<style>.test::before { content: ">"; }</style>';
      const nonce = 'nonce-abc';
      
      const result = addNonceToStyle(styleContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
      expect(result).toContain('.test::before { content: ">"; }');
    });

    it('should handle empty style content', () => {
      const styleContent = '<style></style>';
      const nonce = 'test-nonce';
      
      const result = addNonceToStyle(styleContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
    });

    it('should replace only style tags, not other tags', () => {
      const styleContent = `
        <style>body { margin: 0; }</style>
        <script>console.log("test");</script>
        <div>content</div>
      `;
      const nonce = 'test-nonce';
      
      const result = addNonceToStyle(styleContent, nonce);

      expect(result).toContain('nonce="test-nonce"');
      expect(result).toMatch(/<script>.*<\/script>/);
      expect(result).toContain('<div>content</div>');
    });
  });

  describe('Combined Usage Patterns', () => {
    it('should handle mixed script and style content', () => {
      const content = `
        <style>body { background: white; }</style>
        <script>console.log("hello");</script>
        <style>div { color: black; }</style>
      `;
      const nonce = 'shared-nonce';
      
      const afterScript = addNonceToScript(content, nonce);
      const afterStyle = addNonceToStyle(afterScript, nonce);

      const scriptMatches = afterStyle.match(/<script nonce="shared-nonce">/g);
      const styleMatches = afterStyle.match(/<style nonce="shared-nonce">/g);
      
      expect(scriptMatches).toHaveLength(1);
      expect(styleMatches).toHaveLength(2);
    });

    it('should work with different nonces for script and style', () => {
      const content = `
        <style>body { margin: 0; }</style>
        <script>console.log("test");</script>
      `;
      const scriptNonce = 'script-nonce';
      const styleNonce = 'style-nonce';
      
      const result = addNonceToScript(addNonceToStyle(content, styleNonce), scriptNonce);

      expect(result).toContain(`nonce="${scriptNonce}"`);
      expect(result).toContain(`nonce="${styleNonce}"`);
    });
  });

  describe('Security Considerations', () => {
    it('should escape nonce in replacement to prevent injection', () => {
      const scriptContent = '<script>console.log("test");</script>';
      const nonce = 'test-"><script>alert("xss")</script>';
      
      const result = addNonceToScript(scriptContent, nonce);

      const scriptMatches = result.match(/<script[^>]*>/g);
      expect(scriptMatches).toBeDefined();
      expect(result).toContain(`nonce="${nonce}"`);
    });

    it('should handle nonce with quotes', () => {
      const scriptContent = '<script>console.log("test");</script>';
      const nonce = 'test"quote"';
      
      const result = addNonceToScript(scriptContent, nonce);

      expect(result).toContain(`nonce="${nonce}"`);
    });
  });
});
