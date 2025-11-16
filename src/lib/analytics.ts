// Google Analytics 4 integration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Analytics events for the news website
export const analyticsEvents = {
  // Article engagement
  articleView: (articleId: string, title: string) => 
    event({ action: 'view_article', category: 'engagement', label: `${articleId} - ${title}` }),
  
  articleShare: (articleId: string, platform: string) =>
    event({ action: 'share_article', category: 'engagement', label: `${articleId} - ${platform}` }),
  
  articleComment: (articleId: string) =>
    event({ action: 'comment_article', category: 'engagement', label: articleId }),
  
  // Navigation
  menuClick: (menuItem: string) =>
    event({ action: 'click_menu', category: 'navigation', label: menuItem }),
  
  search: (searchTerm: string) =>
    event({ action: 'search', category: 'navigation', label: searchTerm }),
  
  // Performance
  slowPageLoad: (loadTime: number) =>
    event({ action: 'slow_page_load', category: 'performance', value: Math.round(loadTime) }),
  
  apiError: (endpoint: string) =>
    event({ action: 'api_error', category: 'error', label: endpoint }),
  
  // User interactions
  newsletterSignup: () =>
    event({ action: 'newsletter_signup', category: 'conversion' }),
  
  socialClick: (platform: string, url: string) =>
    event({ action: 'click_social', category: 'engagement', label: `${platform} - ${url}` }),
}

// Privacy-friendly analytics alternative (simple page tracking)
export const simplePageView = (url: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] Page view: ${url}`)
  }
  
  // Store in localStorage for basic analytics
  if (typeof window !== 'undefined') {
    const views = JSON.parse(localStorage.getItem('page_views') || '[]')
    views.push({
      url,
      timestamp: Date.now(),
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    })
    
    // Keep only last 100 views
    if (views.length > 100) {
      views.splice(0, views.length - 100)
    }
    
    localStorage.setItem('page_views', JSON.stringify(views))
  }
}