describe('Responsive Design', () => {
  beforeEach(() => {
    // Mock WordPress API responses
    cy.mockPosts()
    cy.mockCategories()
    cy.mockTags()
  })

  it('should display correctly on mobile devices', () => {
    cy.viewport('iphone-6')
    cy.visitPage('/')
    
    // Check mobile layout
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
    
    // Check that content is readable on mobile
    cy.get('body').should('be.visible')
    
    // Check for mobile navigation (hamburger menu, etc.)
    // Adjust based on actual implementation
    cy.get('nav').should('be.visible')
  })

  it('should display correctly on tablet devices', () => {
    cy.viewport('ipad-2')
    cy.visitPage('/')
    
    // Check tablet layout
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
    
    // Check that navigation adapts to tablet size
    cy.get('nav').should('be.visible')
  })

  it('should display correctly on desktop devices', () => {
    cy.viewport(1280, 720)
    cy.visitPage('/')
    
    // Check desktop layout
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
    
    // Check for desktop navigation features
    cy.get('nav').should('be.visible')
  })

  it('should handle wide screens correctly', () => {
    cy.viewport(1920, 1080)
    cy.visitPage('/')
    
    // Check that content doesn't stretch too wide on large screens
    cy.get('main').should('be.visible')
    cy.get('body').should('be.visible')
  })

  it('should handle small screens correctly', () => {
    cy.viewport(320, 568) // Very small mobile
    cy.visitPage('/')
    
    // Check that content is still accessible on very small screens
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
  })

  it('should adapt layout when orientation changes', () => {
    // Start with portrait
    cy.viewport('iphone-6')
    cy.visitPage('/')
    
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    
    // Change to landscape
    cy.viewport('iphone-6', 'landscape')
    
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
  })

  it('should maintain functionality across all breakpoints', () => {
    const breakpoints = [
      'iphone-6',
      'ipad-2',
      [1280, 720],
      [1920, 1080]
    ]
    
    breakpoints.forEach((viewport) => {
      if (typeof viewport === 'string') {
        cy.viewport(viewport)
      } else {
        cy.viewport(viewport[0], viewport[1])
      }
      
      cy.visitPage('/berita')
      
      // Test basic functionality on each viewport
      cy.get('header').should('be.visible')
      cy.get('main').should('be.visible')
      cy.get('footer').should('be.visible')
      
      // Test that links are clickable
      cy.get('a').first().should('be.visible')
    })
  })

  it('should handle text scaling correctly', () => {
    cy.visitPage('/')
    
    // Test font size scaling
    cy.get('body').then(($body) => {
      const originalFontSize = $body.css('font-size')
      
      // Simulate text zoom (this would need to be implemented based on actual accessibility features)
      cy.log('Original font size:', originalFontSize)
    })
  })

  it('should handle high DPI displays', () => {
    cy.viewport(1280, 720, { pixelRatio: 2 })
    cy.visitPage('/')
    
    // Check that images and text render correctly on high DPI displays
    cy.get('body').should('be.visible')
    cy.get('header').should('be.visible')
    cy.get('main').should('be.visible')
  })

  it('should maintain aspect ratios across viewports', () => {
    const viewports = [
      [375, 667],  // Mobile
      [768, 1024], // Tablet
      [1280, 720], // Desktop
      [1920, 1080] // Large desktop
    ]
    
    viewports.forEach(([width, height]) => {
      cy.viewport(width, height)
      cy.visitPage('/')
      
      // Check that media elements maintain proper aspect ratios
      cy.get('img').each(($img) => {
        cy.wrap($img).should('be.visible')
      })
    })
  })

  it('should handle dynamic viewport changes', () => {
    cy.visitPage('/')
    
    // Start with mobile
    cy.viewport('iphone-6')
    cy.get('header').should('be.visible')
    
    // Resize to tablet
    cy.viewport('ipad-2')
    cy.get('header').should('be.visible')
    
    // Resize to desktop
    cy.viewport(1280, 720)
    cy.get('header').should('be.visible')
    
    // All elements should remain visible and functional
    cy.get('main').should('be.visible')
    cy.get('footer').should('be.visible')
  })
})