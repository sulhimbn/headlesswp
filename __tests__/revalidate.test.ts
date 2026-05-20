describe('Revalidate Endpoint', () => {
  const path = require('path')
  const fs = require('fs')

  it('should have revalidate route file', () => {
    const apiPath = path.join(__dirname, '../src/app/api/revalidate/route.ts')
    expect(fs.existsSync(apiPath)).toBe(true)
  })

  it('should have revalidate route with POST export', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/app/api/revalidate/route.ts'), 'utf8')
    expect(content).toContain('export async function POST')
  })

  it('should have revalidatePath import in route', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/app/api/revalidate/route.ts'), 'utf8')
    expect(content).toContain('revalidatePath')
  })

  it('should have REVALIDATE_SECRET in config', () => {
    const configContent = fs.readFileSync(path.join(__dirname, '../src/lib/api/config.ts'), 'utf8')
    expect(configContent).toContain('REVALIDATE_SECRET')
  })
})