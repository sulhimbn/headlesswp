# Keyboard Shortcuts

This document describes the keyboard shortcuts available for power users.

## Available Shortcuts

| Key | Description | Category |
|-----|-------------|----------|
| `j` | Navigate to next article | Navigation |
| `k` | Navigate to previous article | Navigation |
| `Enter` | Open selected article | Navigation |
| `/` | Focus on search input | Search |
| `?` | Show keyboard shortcuts help | Accessibility |
| `h` | Go to home page | Navigation |
| `b` | Go to news listing | Navigation |
| `Escape` | Close overlay/popup | General |

## Using Keyboard Navigation

1. Press `j` to move to the next article in the list
2. Press `k` to move to the previous article
3. Press `Enter` to open the currently selected article
4. Press `h` to quickly return to the home page
5. Press `b` to view all news articles

## Accessing Help

Press `?` at any time to open the keyboard shortcuts help overlay. Press `Escape` or click outside the overlay to close it.

## Search

Press `/` to focus on the search input field. This works from any page on the site.

## Accessibility

These shortcuts are designed to work alongside screen readers and other assistive technologies:

- Shortcuts are disabled when typing in input fields (except where explicitly allowed)
- The help overlay is fully accessible with proper ARIA attributes
- Focus management is handled when opening/closing the help overlay
- All shortcuts can be customized through the configuration

## Customization

The shortcuts can be customized by providing a configuration to the `KeyboardShortcutsProvider`:

```tsx
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcutsProvider'

const customConfig = {
  shortcuts: [
    { key: 'n', description: 'Next article', category: 'navigation' },
    { key: 'p', description: 'Previous article', category: 'navigation' },
  ],
  enabled: true,
}

<KeyboardShortcutsProvider config={customConfig}>
  {/* Your app content */}
</KeyboardShortcutsProvider>
```
