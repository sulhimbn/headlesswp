import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
    
    // eslint-disable-next-line no-console
    console.log(`Checking if server is ready at ${baseURL}...`)
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 10000 })
        if (response && response.status() < 500) {
          // eslint-disable-next-line no-console
          console.log('Server is ready!')
          break
        }
      } catch {
        if (i === 29) {
          throw new Error('Server did not start in time')
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    await browser.close()
  } catch (error) {
    await browser.close()
    throw error
  }
}

export default globalSetup
