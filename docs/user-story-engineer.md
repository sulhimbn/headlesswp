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
