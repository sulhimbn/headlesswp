# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security

- **Axios**: Upgraded from ^1.13.5 to ^1.15.2 to fix CVE-2025-27152 (SSRF vulnerability via absolute URL bypass)

### UX

- **Category Pages**: Added loading skeleton via `loading.tsx` with PostCardSkeleton components
- **Tag Pages**: Added loading skeleton via `loading.tsx` with PostCardSkeleton components
- **Category Pages**: Added inline error boundary with retry button via `error.tsx`
- **Tag Pages**: Added inline error boundary with retry button via `error.tsx`
- **UI_TEXT**: Added localized error messages for category/tag error states

### DX

- **ESLint**: Upgraded from v10.x to v9.x (latest v9.39.4) for security and active maintenance
- **envValidation.ts**: Replaced direct console usage with centralized logger utility
- **Error handling**: Replaced empty catch blocks with centralized logger in src/app/page.tsx and PersonalizedRecommendations.tsx

## [1.0.0] - 2024-01-01

### Added

- Initial release