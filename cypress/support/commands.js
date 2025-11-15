// Custom Cypress commands for the headless WordPress application

// Command to visit a page and wait for it to load
Cypress.Commands.add('visitPage', (path = '/') => {
  cy.visit(path, {
    timeout: 30000,
    failOnStatusCode: false // Don't fail on 404/500 for testing error handling
  })
  cy.get('body', { timeout: 10000 }).should('be.visible')
})

// Command to check if WordPress API is accessible
Cypress.Commands.add('checkWordPressAPI', () => {
  cy.request({
    url: Cypress.env('NEXT_PUBLIC_WORDPRESS_API_URL'),
    failOnStatusCode: false
  }).then((response) => {
    cy.log('WordPress API Status:', response.status)
    return response
  })
})

// Command to mock WordPress API responses
Cypress.Commands.add('mockWordPressAPI', (endpoint, mockData) => {
  cy.intercept('GET', `**/wp-json${endpoint}`, {
    statusCode: 200,
    body: mockData
  }).as(`mock-${endpoint}`)
})

// Command to mock WordPress posts
Cypress.Commands.add('mockPosts', (posts = []) => {
  const defaultPosts = posts.length > 0 ? posts : [
    {
      id: 1,
      title: { rendered: 'Test Post 1' },
      content: { rendered: '<p>Test content 1</p>' },
      excerpt: { rendered: '<p>Test excerpt 1</p>' },
      slug: 'test-post-1',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [1],
      tags: [1],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post-1'
    },
    {
      id: 2,
      title: { rendered: 'Test Post 2' },
      content: { rendered: '<p>Test content 2</p>' },
      excerpt: { rendered: '<p>Test excerpt 2</p>' },
      slug: 'test-post-2',
      date: '2024-01-02T00:00:00',
      modified: '2024-01-02T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [2],
      tags: [2],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post-2'
    }
  ]
  
  cy.mockWordPressAPI('/wp/v2/posts', defaultPosts)
})

// Command to mock WordPress categories
Cypress.Commands.add('mockCategories', (categories = []) => {
  const defaultCategories = categories.length > 0 ? categories : [
    {
      id: 1,
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts',
      parent: 0,
      count: 5
    },
    {
      id: 2,
      name: 'News',
      slug: 'news',
      description: 'Latest news',
      parent: 0,
      count: 10
    }
  ]
  
  cy.mockWordPressAPI('/wp/v2/categories', defaultCategories)
})

// Command to mock WordPress tags
Cypress.Commands.add('mockTags', (tags = []) => {
  const defaultTags = tags.length > 0 ? tags : [
    {
      id: 1,
      name: 'JavaScript',
      slug: 'javascript',
      description: 'JavaScript related posts',
      count: 3
    },
    {
      id: 2,
      name: 'React',
      slug: 'react',
      description: 'React framework posts',
      count: 2
    }
  ]
  
  cy.mockWordPressAPI('/wp/v2/tags', defaultTags)
})

// Command to check responsive design
Cypress.Commands.add('checkResponsive', (breakpoints = ['iphone-6', 'ipad-2', [1280, 720]]) => {
  breakpoints.forEach((viewport) => {
    if (typeof viewport === 'string') {
      cy.viewport(viewport)
    } else {
      cy.viewport(viewport[0], viewport[1])
    }
    
    cy.log(`Testing on viewport: ${typeof viewport === 'string' ? viewport : `${viewport[0]}x${viewport[1]}`}`)
    
    // Check that main elements are visible and properly positioned
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
  })
})

// Command to test navigation
Cypress.Commands.add('testNavigation', (paths) => {
  paths.forEach((path) => {
    cy.visitPage(path)
    cy.url().should('include', path)
    cy.get('body').should('be.visible')
  })
})

// Command to test loading states
Cypress.Commands.add('testLoadingStates', () => {
  // Intercept API calls to test loading states
  cy.intercept('GET', '**/wp-json/**', { delay: 1000 }).as('slowAPI')
  
  cy.visitPage('/')
  cy.get('[data-testid="loading"]').should('be.visible')
  cy.wait('@slowAPI')
  cy.get('[data-testid="loading"]').should('not.exist')
})

// Command to test error handling
Cypress.Commands.add('testErrorHandling', () => {
  // Mock API errors
  cy.intercept('GET', '**/wp-json/**', { statusCode: 500 }).as('apiError')
  
  cy.visitPage('/')
  cy.wait('@apiError')
  
  // Check that error boundary is displayed
  cy.get('[data-testid="error-boundary"]').should('be.visible')
  cy.contains('Terjadi Kesalahan').should('be.visible')
})

// Command to test CSP violations
Cypress.Commands.add('testCSPViolation', () => {
  // Inject inline script to trigger CSP violation
  cy.window().then((win) => {
    const script = win.document.createElement('script')
    script.textContent = 'console.log("CSP violation test")'
    win.document.head.appendChild(script)
  })
  
  // Check that CSP report is sent (mocked)
  cy.intercept('POST', '**/api/csp-report', {}).as('cspReport')
  cy.wait('@cspReport', { timeout: 5000 })
})

// Command to check accessibility
Cypress.Commands.add('checkAccessibility', () => {
  // This would require cypress-axe plugin for full accessibility testing
  // For now, we'll check basic accessibility features
  cy.get('h1').should('exist')
  cy.get('nav').should('exist')
  cy.get('main').should('exist')
  
  // Check that all images have alt attributes
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt')
  })
  
  // Check that all links have href attributes
  cy.get('a').each(($link) => {
    cy.wrap($link).should('have.attr', 'href')
  })
})

// Command to test performance
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const perfData = win.performance.getEntriesByType('navigation')[0]
    const loadTime = perfData.loadEventEnd - perfData.loadEventStart
    
    cy.log(`Page load time: ${loadTime}ms`)
    
    // Assert that page loads within reasonable time
    expect(loadTime).to.be.lessThan(5000) // 5 seconds
  })
})

// Export commands for TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      visitPage(path?: string): Chainable<Element>
      checkWordPressAPI(): Chainable<Response>
      mockWordPressAPI(endpoint: string, mockData: any): Chainable<void>
      mockPosts(posts?: any[]): Chainable<void>
      mockCategories(categories?: any[]): Chainable<void>
      mockTags(tags?: any[]): Chainable<void>
      checkResponsive(breakpoints?: any[]): Chainable<void>
      testNavigation(paths: string[]): Chainable<void>
      testLoadingStates(): Chainable<void>
      testErrorHandling(): Chainable<void>
      testCSPViolation(): Chainable<void>
      checkAccessibility(): Chainable<void>
      checkPerformance(): Chainable<void>
    }
  }
}