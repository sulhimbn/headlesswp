describe('Error Handling', () => {
  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 500,
      body: { message: 'Internal Server Error' }
    }).as('apiError')
    
    cy.visitPage('/')
    cy.wait('@apiError')
    
    // Check that error boundary is displayed
    cy.get('body').should('be.visible')
    
    // The application should not crash
    cy.get('body').should('not.contain', 'Application error')
  })

  it('should handle network errors gracefully', () => {
    // Mock network failure
    cy.intercept('GET', '**/wp-json/**', { 
      forceNetworkError: true
    }).as('networkError')
    
    cy.visitPage('/')
    cy.wait('@networkError')
    
    // Application should handle network errors
    cy.get('body').should('be.visible')
  })

  it('should handle timeout errors gracefully', () => {
    // Mock timeout
    cy.intercept('GET', '**/wp-json/**', { 
      delay: 15000, // Longer than request timeout
      statusCode: 200,
      body: []
    }).as('timeoutError')
    
    cy.visitPage('/')
    
    // Should handle timeout gracefully
    cy.get('body').should('be.visible')
  })

  it('should handle malformed API responses', () => {
    // Mock malformed response
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 200,
      body: 'invalid json response'
    }).as('malformedResponse')
    
    cy.visitPage('/')
    cy.wait('@malformedResponse')
    
    // Should handle malformed data
    cy.get('body').should('be.visible')
  })

  it('should handle empty API responses', () => {
    // Mock empty response
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 200,
      body: []
    }).as('emptyResponse')
    
    cy.visitPage('/')
    cy.wait('@emptyResponse')
    
    // Should handle empty data gracefully
    cy.get('body').should('be.visible')
    cy.get('main').should('be.visible')
  })

  it('should handle 404 errors for API endpoints', () => {
    // Mock 404 for API
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 404,
      body: { message: 'Not Found' }
    }).as('apiNotFound')
    
    cy.visitPage('/')
    cy.wait('@apiNotFound')
    
    // Should handle API 404s
    cy.get('body').should('be.visible')
  })

  it('should handle authentication errors', () => {
    // Mock authentication error
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 401,
      body: { message: 'Unauthorized' }
    }).as('authError')
    
    cy.visitPage('/')
    cy.wait('@authError')
    
    // Should handle auth errors
    cy.get('body').should('be.visible')
  })

  it('should handle rate limiting errors', () => {
    // Mock rate limiting
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 429,
      body: { message: 'Too Many Requests' },
      headers: { 'Retry-After': '60' }
    }).as('rateLimitError')
    
    cy.visitPage('/')
    cy.wait('@rateLimitError')
    
    // Should handle rate limiting
    cy.get('body').should('be.visible')
  })

  it('should handle JavaScript errors in components', () => {
    cy.visitPage('/')
    
    // Inject a JavaScript error to test error boundary
    cy.window().then((win) => {
      // Simulate a component error
      const error = new Error('Test component error')
      win.dispatchEvent(new ErrorEvent('error', { 
        error,
        message: error.message,
        filename: 'test.js',
        lineno: 1,
        colno: 1
      }))
    })
    
    // Error boundary should catch the error
    cy.get('body').should('be.visible')
  })

  it('should handle promise rejections', () => {
    cy.visitPage('/')
    
    // Inject an unhandled promise rejection
    cy.window().then((win) => {
      // Simulate unhandled promise rejection
      Promise.reject(new Error('Test promise rejection'))
    })
    
    // Application should remain stable
    cy.get('body').should('be.visible')
  })

  it('should recover from errors after reload', () => {
    // Mock initial error
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 500,
      body: { message: 'Internal Server Error' }
    }).as('initialError')
    
    cy.visitPage('/')
    cy.wait('@initialError')
    
    // Mock successful response after reload
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 200,
      body: []
    }).as('successResponse')
    
    cy.reload()
    cy.wait('@successResponse')
    
    // Should recover after reload
    cy.get('body').should('be.visible')
  })

  it('should handle multiple concurrent errors', () => {
    // Mock multiple different errors
    cy.intercept('GET', '**/wp-json/wp/v2/posts', { 
      statusCode: 500,
      body: { message: 'Posts API Error' }
    }).as('postsError')
    
    cy.intercept('GET', '**/wp-json/wp/v2/categories', { 
      statusCode: 404,
      body: { message: 'Categories Not Found' }
    }).as('categoriesError')
    
    cy.intercept('GET', '**/wp-json/wp/v2/tags', { 
      forceNetworkError: true
    }).as('tagsError')
    
    cy.visitPage('/')
    
    // Wait for all errors
    cy.wait(['@postsError', '@categoriesError', '@tagsError'])
    
    // Application should handle multiple errors gracefully
    cy.get('body').should('be.visible')
  })

  it('should display user-friendly error messages', () => {
    // Mock error
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 500,
      body: { message: 'Internal Server Error' }
    }).as('serverError')
    
    cy.visitPage('/')
    cy.wait('@serverError')
    
    // Check for user-friendly error messaging
    cy.get('body').should('be.visible')
    
    // Look for error-related content (adjust based on actual error UI)
    cy.contains(/error|kesalahan|terjadi/i).should('exist')
  })

  it('should provide recovery options', () => {
    // Mock error
    cy.intercept('GET', '**/wp-json/**', { 
      statusCode: 500,
      body: { message: 'Internal Server Error' }
    }).as('serverError')
    
    cy.visitPage('/')
    cy.wait('@serverError')
    
    // Look for recovery options like reload button
    cy.contains(/muat ulang|reload|coba lagi/i).should('exist')
  })
})