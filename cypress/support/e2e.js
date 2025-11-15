// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom Cypress commands here
// For example, to handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are not critical to the test
  if (err.message.includes('Script error')) {
    return false
  }
  return true
})

// Add global beforeEach hook for consistent test environment
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage()
  
  // Clear cookies before each test
  cy.clearCookies()
})

// Add global afterEach hook for cleanup
afterEach(() => {
  // Take screenshot on test failure (handled by Cypress config)
  // Additional cleanup can be added here
})