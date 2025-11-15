describe('Application Navigation', () => {
  beforeEach(() => {
    // Mock WordPress API responses
    cy.mockPosts()
    cy.mockCategories()
    cy.mockTags()
  })

  it('should load the home page successfully', () => {
    cy.visitPage('/')
    
    // Check that page loads
    cy.url().should('include', '/')
    cy.get('body').should('be.visible')
    
    // Check for main navigation elements
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
  })

  it('should navigate to berita page', () => {
    cy.visitPage('/berita')
    
    cy.url().should('include', '/berita')
    cy.get('body').should('be.visible')
    
    // Check that berita page content loads
    cy.get('main').should('be.visible')
  })

  it('should navigate to individual post page', () => {
    cy.visitPage('/berita/test-post-1')
    
    cy.url().should('include', '/berita/test-post-1')
    cy.get('body').should('be.visible')
    
    // Check that post content is displayed
    cy.get('main').should('be.visible')
  })

  it('should handle 404 pages gracefully', () => {
    cy.visitPage('/non-existent-page', { failOnStatusCode: false })
    
    // Should still show the application with error handling
    cy.get('body').should('be.visible')
  })

  it('should navigate between pages using links', () => {
    cy.visitPage('/')
    
    // Look for navigation links (adjust selectors based on actual implementation)
    cy.get('a[href*="/berita"]').first().click({ force: true })
    
    cy.url().should('include', '/berita')
    cy.get('body').should('be.visible')
  })

  it('should handle browser back and forward navigation', () => {
    cy.visitPage('/')
    cy.visitPage('/berita')
    
    // Go back
    cy.go('back')
    cy.url().should('include', '/')
    
    // Go forward
    cy.go('forward')
    cy.url().should('include', '/berita')
  })

  it('should handle page refresh', () => {
    cy.visitPage('/berita')
    
    cy.reload()
    cy.url().should('include', '/berita')
    cy.get('body').should('be.visible')
  })

  it('should handle URL parameters correctly', () => {
    cy.visitPage('/berita?category=technology&page=1')
    
    cy.url().should('include', 'category=technology')
    cy.url().should('include', 'page=1')
    cy.get('body').should('be.visible')
  })

  it('should handle hash fragments', () => {
    cy.visitPage('/berita#section1')
    
    cy.url().should('include', '#section1')
    cy.get('body').should('be.visible')
  })

  it('should maintain navigation state during rapid navigation', () => {
    const paths = ['/', '/berita', '/berita/test-post-1']
    
    paths.forEach((path, index) => {
      cy.visitPage(path)
      cy.url().should('include', path)
      
      if (index < paths.length - 1) {
        // Rapid navigation to next page
        cy.visitPage(paths[index + 1])
      }
    })
  })
})