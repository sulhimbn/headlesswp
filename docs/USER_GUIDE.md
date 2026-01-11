# User Guide

Guide for using HeadlessWP website. This document covers common tasks and features for end users.

## Table of Contents

- [Getting Started](#getting-started)
- [Browsing Posts](#browsing-posts)
- [Reading Articles](#reading-articles)
- [Searching Content](#searching-content)
- [Categories & Tags](#categories--tags)
- [Mobile Usage](#mobile-usage)
- [Accessibility Features](#accessibility-features)
- [Troubleshooting User Issues](#troubleshooting-user-issues)

---

## Getting Started

### Accessing the Website

HeadlessWP is accessible at: https://mitrabantennews.com

**Supported Browsers**:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)

### Homepage Layout

The homepage displays:
- **Latest news**: Recent articles from various categories
- **Featured posts**: Important or trending articles
- **Navigation menu**: Quick links to categories and pages
- **Footer**: Site information and links

### Navigation

#### Main Navigation

1. **Header Menu** - Browse by category (Politik, Ekonomi, Olahraga, etc.)
2. **Home** - Return to homepage
3. **Berita** - All news articles list

#### Breadcrumb Navigation

Each article page shows a breadcrumb trail:
```
Home > Berita > [Category Name] > Article Title
```
Click any breadcrumb to navigate back.

---

## Browsing Posts

### Viewing All News

Click "Berita" in the header to view all news articles.

**Features**:
- **Pagination**: Navigate between pages of articles
- **Sorting**: Articles sorted by publication date (newest first)
- **Loading indicators**: Visual feedback while content loads

### Understanding Post Cards

Each post card displays:
- **Title**: Article headline
- **Category**: Category badge (e.g., "Politik", "Ekonomi")
- **Date**: Publication date
- **Excerpt**: Brief summary of article
- **"Baca Selengkapnya"** button: Link to full article

---

## Reading Articles

### Article Page Layout

When you click on a post, the article page displays:

1. **Breadcrumb**: Navigation path
2. **Article Title**: Headline
3. **Meta Information**: Author, date, category
4. **Featured Image**: Main image (if available)
5. **Article Content**: Full article text and media
6. **Related Posts**: Similar articles (if available)

### Reading Features

- **Responsive design**: Articles adapt to screen size
- **Fast loading**: Optimized for quick content delivery
- **Clean layout**: Distraction-free reading experience
- **Indonesian language**: Content in Bahasa Indonesia

### Sharing Articles

Currently, direct sharing buttons are not available. To share an article:

1. Copy the URL from your browser's address bar
2. Share via email, messaging apps, or social media

---

## Searching Content

### Using the Search Bar

Search for articles by keyword using the search bar on any page.

**Features**:
- **Debounced search**: Automatically waits after you stop typing before searching (reduces unnecessary API calls)
- **Loading indicator**: Shows spinner while searching
- **Clear button**: Click to clear your search and start over
- **Keyboard navigation**: Full keyboard support (Tab, Enter, Escape)

**How to Search**:
1. Click on the search bar (or press Tab to navigate to it)
2. Type your search query
3. Wait briefly (search is debounced for better performance)
4. View search results as they appear
5. Press Enter to submit your search immediately
6. Click the X (clear) button to reset search

**Search Tips**:
- Use specific keywords for better results
- Try different variations (e.g., "pemilihan" vs "pilpres")
- Search works across all articles, categories, and tags
- Search is not case-sensitive

---

## Categories & Tags

### Categories

Browse articles by topic using category navigation:

**Available Categories**:
- **Politik**: Political news and updates
- **Ekonomi**: Economic and business news
- **Olahraga**: Sports news and updates
- **Hukum**: Legal and judicial news
- **Kesehatan**: Health-related articles
- And more categories as added

### Viewing Category Posts

1. Click category name in navigation menu
2. View all articles in that category
3. Use pagination to browse more articles

### Tags

Tags help organize related content. Currently, tag browsing is not available on the frontend. This feature is planned for future updates.

---

## Mobile Usage

### Mobile View

The website is fully responsive and optimized for mobile devices.

**Mobile Features**:
- **Touch-friendly buttons**: Large tap targets (minimum 44x44px)
- **Readable text**: Automatically sized for mobile screens
- **Fast loading**: Optimized for mobile networks
- **Swipe to scroll**: Natural touch navigation

### Mobile Navigation

- **Hamburger menu**: Tap menu icon (☰) to access navigation
- **Compact layout**: Optimized for small screens
- **Quick access**: Category links easily accessible

### Mobile Tips

1. **Use landscape mode** for better image viewing
2. **Pin to home screen** for quick access
3. **Bookmark articles** for offline reading (browser feature)

---

## Accessibility Features

### Screen Reader Support

The website includes accessibility features for users with disabilities:

- **Semantic HTML**: Proper heading structure and landmarks
- **ARIA attributes**: Screen reader compatibility
- **Skip to content**: Keyboard shortcut to jump to main content

### Keyboard Navigation

Navigate the website using your keyboard:

- **Tab**: Move between interactive elements
- **Shift + Tab**: Move backwards
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals or menus
- **Skip link**: Press Tab after page load to skip navigation

### Visual Accessibility

- **High contrast**: WCAG AA compliant color ratios
- **Focus indicators**: Clear visual feedback for keyboard users
- **Readable fonts**: Optimized font sizes and line heights
- **Scalable text**: Zoom up to 200% without breaking layout

### Audio Descriptions

Currently, audio descriptions for images are not available. Alt text is provided for screen readers.

---

## Troubleshooting User Issues

### Page Not Loading

**Symptoms**:
- Blank page
- Loading spinner continues indefinitely
- Browser shows error message

**Solutions**:

1. **Refresh the page**: Press F5 or Ctrl+R (Cmd+R on Mac)
2. **Check internet connection**: Ensure you're online
3. **Try different browser**: Test with Chrome, Firefox, or Safari
4. **Clear browser cache**:
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E
5. **Wait and retry**: The site might be temporarily down

### Images Not Displaying

**Symptoms**:
- Article text loads but images missing
- Broken image icons displayed

**Solutions**:

1. **Refresh the page**: Images might load on retry
2. **Check internet connection**: Slow connections delay image loading
3. **Disable ad blockers**: Some ad blockers block images
4. **Wait for images to load**: Large images take time

### Content in Wrong Language

**Symptoms**:
- Content displays in English instead of Indonesian
- Mixed language on the page

**Solutions**:

1. **Check browser language settings**: Site content is in Indonesian
2. **Refresh the page**: Translation might have loaded incorrectly
3. **Clear browser cache**: Cached content might be outdated

### Slow Page Loading

**Symptoms**:
- Pages take more than 5 seconds to load
- Videos or images buffer slowly

**Solutions**:

1. **Check internet speed**: Slow connection causes slow loading
2. **Close other tabs**: Free up bandwidth
3. **Disable browser extensions**: Some extensions slow down page load
4. **Use faster browser**: Chrome or Edge are generally faster
5. **Wait for busy periods**: High traffic can slow the site

### Mobile-Specific Issues

**Symptoms**:
- Layout looks broken on mobile
- Text too small or too large
- Buttons not responding

**Solutions**:

1. **Update your browser**: Ensure latest mobile browser version
2. **Rotate device**: Try portrait and landscape modes
3. **Clear mobile browser cache**: Remove old cached data
4. **Restart browser**: Close and reopen browser app
5. **Try different mobile browser**: Test with Chrome, Safari, or Firefox

---

## Contact & Support

### Reporting Issues

If you encounter issues not covered in this guide:

**Contact Information**:
- **Website**: https://mitrabantennews.com
- **GitHub Issues**: https://github.com/sulhimbn/headlesswp/issues

### Feedback

We welcome your feedback on improving the user experience. Contact us with:
- Feature suggestions
- Bug reports
- Accessibility concerns
- Mobile usability issues

### Privacy

Your privacy is important. The website:
- Does not collect personal information without consent
- Uses cookies for essential functionality only
- Does not sell user data
- Complies with applicable data protection laws

---

## Tips for Better Experience

### Reading Articles

1. **Use night mode** (if available) to reduce eye strain
2. **Bookmark interesting articles** for later reading
3. **Share articles** with friends and family
4. **Read related articles** at the bottom of each article

### Browsing Content

1. **Check multiple categories** for different perspectives
2. **Visit regularly** for latest news updates
3. **Use search** to find specific topics
4. **Follow links** to external sources for more information

### Mobile Usage

1. **Add to home screen** for quick access
2. **Use Wi-Fi** when possible to save mobile data
3. **Bookmark favorites** in your mobile browser
4. **Share directly** from mobile browser

---

## Future Features

The following features are planned for future updates:

- **Tag browsing**: Browse articles by tags
- **Comments section**: Discussion on articles
- **Share buttons**: Easy sharing to social media
- **Dark mode**: Theme customization
- **Newsletter subscription**: Receive updates via email

Check the website and GitHub for updates on these features.

---

## Glossary

| Term | Meaning |
|-------|----------|
| **Headless CMS** | Content management system without built-in frontend. WordPress stores content; Next.js displays it. |
| **Static Site Generation (SSG)** | Pre-generating pages at build time for fast loading. |
| **Incremental Static Regeneration (ISR)** | Rebuilding pages periodically to keep content fresh. |
| **Responsive Design** | Website layout adapts to different screen sizes (mobile, tablet, desktop). |
| **Accessibility (A11y)** | Design features that help users with disabilities. |
| **WCAG** | Web Content Accessibility Guidelines - standards for accessible web design. |
| **Alt Text** | Alternative text for images, used by screen readers. |
| **Breadcrumb** | Navigation path showing user's location in the site hierarchy. |
| **Pagination** | Navigation between multiple pages of content. |

---

## Legal & Policies

### Terms of Service

By using this website, you agree to our terms of service. Please visit the website for full terms.

### Privacy Policy

We respect your privacy. Please visit the website for our complete privacy policy.

### Copyright

All content on this website is copyright © 2024 Mitra Banten News. All rights reserved.

---

Thank you for using HeadlessWP!

For questions or issues not covered in this guide, please contact us through the website or GitHub issues.