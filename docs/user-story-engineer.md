# User-Story Engineer Agent - Long-term Memory

## Purpose
This file serves as the long-term memory for the user-story-engineer autonomous agent.

## Domain
- User stories and feature requirements
- User experience improvements
- Small, safe, measurable improvements
- UI text consistency and localization

## Improvement Patterns

### Small, Safe Improvements
1. Fix inconsistent language in UI text (e.g., English vs Indonesian)
2. Add missing UI text constants
3. Improve user-facing error messages
4. Add placeholder text for better UX
5. Ensure consistency in labeling across the application

## Previous Work

### 2026-02-26
- Fixed test warning: Replaced deprecated `button.click()` with `fireEvent.click()` in ServiceStatus test
- This eliminates React warning about synthetic events in tests
- Related to issue #546
- Verified tests pass with no React warnings
- PR #563 created with user-story-engineer label

### 2026-02-25
- Fixed UI text inconsistency: Changed `metaInfo.by` from 'By' to 'Oleh' (Indonesian)
- Fixed UI text inconsistency: Changed `postDetail.tags` from 'Tags' to 'Tag' (Indonesian)
- Fixed UI text inconsistency: Changed footer copyright 'All rights reserved' to 'Seluruh hak cipta' (Indonesian)
- These changes ensure consistency with the Indonesian language used throughout the application
- Updated related tests in `__tests__/uiText.test.ts` and `__tests__/components/MetaInfo.test.tsx`
- PR #499 created for copyright fix

## Known Gaps
- Some UI text may still have English words mixed with Indonesian
- Consider auditing all UI text for language consistency

## Notes
- Always verify changes don't break existing tests
- Keep diffs small and atomic
- Focus on improvements that enhance user experience
- Link to related issues when possible
- Issue #546 about fixing ServiceStatus test was originally a QA issue but picked up as a small improvement
- The QA agent had previously added tests for ServiceStatus (PR #495), this fix resolves the React warning

### 2026-02-27
- Extracted hardcoded service status labels to UI_TEXT constants
- Added `serviceStatus` section to UI_TEXT with three status labels (healthy, degraded, down)
- Updated ServiceStatus component to use UI_TEXT instead of hardcoded strings
- This improves maintainability by centralizing UI text
- All tests passed (2068 tests), lint passed, typecheck passed
- PR #582 created with user-story-engineer label
- Process: Scanned for hardcoded text in components, found in ServiceStatus.tsx, extracted to constants

### 2026-02-27
- Localized pagination aria-labels to Indonesian
- Added `ariaLabel`, `previousPage`, `nextPage`, `morePages` to pagination UI_TEXT
- Changed aria-label "Pagination" to "Navigasi halaman"
- Changed aria-label "Previous page" to "Halaman sebelumnya"
- Changed aria-label "Next page" to "Halaman selanjutnya"
- Changed aria-label "More pages" to "Halaman lainnya"
- Changed page link aria-label from "Page N" to "Halaman N"
- Updated Pagination component to use UI_TEXT constants
- Updated tests in Pagination.test.tsx, pageComponents.test.tsx, accessibility.test.tsx
- All tests passed (2076 tests), lint passed, typecheck passed
- PR #605 created with user-story-engineer label
- Process: Scanned components for hardcoded English aria-labels, found in Pagination.tsx, extracted to constants

### 2026-02-27
- Added missing PWA icons and assets for issue #646
- Created icon-192.png (192x192) for PWA installation
- Created icon-512.png (512x512) for PWA installation
- Created apple-touch-icon.png (180x180) for Apple devices
- Created og-image.jpg (1200x630) for social sharing preview
- Created logo.png (512x512) for schema.org logo
- Created scripts/generate-icons.js to regenerate icons if needed
- This improves user experience by enabling PWA installation on mobile and proper social sharing
- All tests passed (2118 tests), lint passed, typecheck passed
- PR #659 created with user-story-engineer label
- Process: Identified missing icons from manifest.json and layout.tsx, used jimp to generate placeholder icons
