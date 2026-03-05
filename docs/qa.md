# Accessibility Testing Documentation

## Overview

This project uses **jest-axe** for automated accessibility testing in the CI pipeline. Accessibility (a11y) tests are integrated to catch WCAG violations early in development.

## Setup

### Installation

The `jest-axe` package is already installed as a dev dependency:

```json
{
  "devDependencies": {
    "jest-axe": "^10.0.0"
  }
}
```

### Configuration

Jest is configured to use jest-axe in `jest.setup.js`:

```javascript
require('jest-axe/extend-expect')
```

## Running Accessibility Tests

### Run all accessibility tests:
```bash
npm run test -- __tests__/accessibility.test.tsx
```

### Run all tests (including accessibility):
```bash
npm run test
```

## Test Structure

Accessibility tests are located in `__tests__/accessibility.test.tsx` and cover:

| Component | Tests |
|-----------|-------|
| Header | No violations, navigation role |
| Footer | No violations, contentinfo role, heading structure |
| PostCard | No violations, article role, heading |
| SearchBar | No violations, search role, labels |
| Button | No violations, button role, focus styles |
| Pagination | No violations, navigation with aria-label |
| EmptyState | No violations, status role |
| Badge | No violations (span and link variants) |
| SectionHeading | No violations, heading levels |
| Breadcrumb | No violations, navigation, list structure |
| MetaInfo | No violations, semantic structure |
| SocialShare | No violations, button labels |

## CI Integration

The CI pipeline runs accessibility tests in `.github/workflows/ci.yml`:

```yaml
- name: Run accessibility tests
  run: npm run test -- __tests__/accessibility.test.tsx
  continue-on-error: true
```

Tests will fail the build if there are critical accessibility violations.

## WCAG Guidelines

The tests check for common WCAG violations including:

- **Color Contrast**: Text must have sufficient contrast ratios
- **ARIA Labels**: Interactive elements must have accessible names
- **Semantic HTML**: Proper use of heading levels, roles, and landmarks
- **Keyboard Accessibility**: Focusable elements and focus indicators
- **Image Alt Text**: Images must have alternative text

## Adding New Accessibility Tests

To add accessibility tests for a new component:

```tsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import MyComponent from '@/components/MyComponent'

describe('MyComponent Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## Best Practices

1. **Run axe tests after any component change**
2. **Test both default and variant states**
3. **Verify ARIA attributes are correct**
4. **Ensure keyboard navigation works**
5. **Check screen reader announcements**

## References

- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
