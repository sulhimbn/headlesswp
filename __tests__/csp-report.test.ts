describe('CSP Report API Configuration', () => {
  it('should have CSP report API route file', () => {
    // Check if file exists
    const fs = require('fs')
    const path = require('path')
    const apiPath = path.join(__dirname, '../src/app/api/csp-report/route.ts')

    expect(fs.existsSync(apiPath)).toBe(true)
  })

  it('should have middleware file for security headers', () => {
    const fs = require('fs')
    const path = require('path')
    const middlewarePath = path.join(__dirname, '../src/middleware.ts')

    expect(fs.existsSync(middlewarePath)).toBe(true)
  })

  it('should have CSP utilities file', () => {
    const fs = require('fs')
    const path = require('path')
    const utilsPath = path.join(__dirname, '../src/lib/csp-utils.ts')

    expect(fs.existsSync(utilsPath)).toBe(true)
  })
})
