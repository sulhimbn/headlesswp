# QA Testing Documentation

## Accessibility Testing

This document outlines the accessibility testing strategy and procedures for the headlesswp project.

### Overview

Automated accessibility testing is integrated into the CI pipeline to catch accessibility issues before they reach production. The project uses **jest-axe** for automated accessibility testing.

### Dependencies

- **jest-axe**: ^10.0.0 - Dev dependency installed for accessibility testing

### Test Files

Accessibility tests are located in `__tests__/accessibility.test.tsx` and cover the following components:

- Header
- Footer
- PostCard
- SearchBar
- Button
- Pagination
- EmptyState
- Badge
- SectionHeading

### Running Accessibility Tests

```bash
# Run all accessibility tests
npm test -- --testNamePattern="should have no accessibility violations"

# Run specific component accessibility tests
npm test -- --testNamePattern="Accessibility Tests > Button"
```

### CI Integration

Accessibility tests run automatically in the CI pipeline:

1. **Primary test suite**: All tests including accessibility run with `npm test`
2. **Dedicated accessibility check**: A separate step runs accessibility-specific tests to provide clear visibility

### Failing on Violations

The accessibility tests use `expect(results).toHaveNoViolations()` which will fail the build if any accessibility violations are detected. This ensures:

- No critical accessibility issues reach production
- All new components pass basic accessibility checks
- Consistent accessibility standards across the codebase

### Best Practices

1. **Run tests locally**: Before pushing, run accessibility tests to catch issues early
2. **Test all new components**: Add accessibility tests for any new UI components
3. **Use semantic HTML**: Prefer semantic elements (button, nav, article, etc.)
4. **Add proper labels**: Ensure form inputs have labels, images have alt text
5. **Focus management**: Ensure focus indicators are visible and logical

### WCAG Guidelines

The project follows WCAG 2.1 Level AA guidelines. Common checks include:

- Color contrast ratios
- Keyboard accessibility
- Screen reader compatibility
- Focus indicators
- Proper heading hierarchy
- Form labels and error messages

### Adding Accessibility Tests

To add accessibility tests for a new component:

```tsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Related Documentation

- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Documentation](https://www.deque.com/axe/core-concepts/)
