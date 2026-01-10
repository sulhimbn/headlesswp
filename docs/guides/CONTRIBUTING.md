# Contributing to Headless WordPress

Thank you for your interest in contributing to the Headless WordPress project! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please read and follow these guidelines in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- WordPress instance with REST API enabled (for development)
- Docker & Docker Compose (for local WordPress setup)
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/headlesswp.git
   cd headlesswp
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

5. Update `.env.local` with your WordPress configuration

6. Start development server:
   ```bash
   npm run dev
   ```

## Contributing Guidelines

### Types of Contributions

We welcome the following types of contributions:

- 🐛 **Bug fixes** - Fixing reported issues
- ✨ **New features** - Adding new functionality
- 📚 **Documentation** - Improving docs and examples
- 🎨 **UI/UX improvements** - Design and user experience
- ⚡ **Performance** - Optimizing performance
- 🧪 **Tests** - Adding or improving tests

### Before You Start

1. Check existing [issues](https://github.com/sulhimbn/headlesswp/issues) and [pull requests](https://github.com/sulhimbn/headlesswp/pulls)
2. Create an issue for major changes before starting work
3. Discuss your approach in the issue comments

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow the coding standards below
- Add tests for new functionality
- Update documentation as needed
- Keep commits small and focused

### 3. Test Your Changes

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### 4. Submit Pull Request

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request with:
   - Clear title and description
   - Reference related issues
   - Screenshots for UI changes
   - Testing instructions

### 5. Review Process

- All PRs require review
- Maintain discussion in comments
- Address feedback promptly
- Keep PR up to date with main branch

## Issue Reporting

### Bug Reports

Use the [Bug Report template](https://github.com/sulhimbn/headlesswp/issues/new?assignees=&labels=type%3A+bug&template=bug_report.md) and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Use the [Feature Request template](https://github.com/sulhimbn/headlesswp/issues/new?assignees=&labels=type%3A+enhancement&template=feature_request.md) and include:

- Problem statement
- Proposed solution
- Alternative approaches
- Additional context

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React Components

- Use functional components with hooks
- Follow React best practices
- Keep components small and focused
- Use proper TypeScript types

### CSS/Styling

- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors
- Use semantic HTML

### Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat: add new feature
fix: resolve bug
docs: update documentation
style: improve formatting
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Security and Dependency Management

### Security Audits

```bash
# Run security audit (moderate and above)
npm run audit:security

# Run full security audit (including low severity)
npm run audit:full
```

### Dependency Management

```bash
# Check for outdated dependencies
npm run deps:check

# Update dependencies (patch and minor versions)
npm run deps:update

# Install dependencies (clean install)
npm ci
```

### Security Guidelines

- Always run `npm run audit:security` before committing changes
- Keep dependencies updated to avoid security vulnerabilities
- Use `npm ci` for clean installs in CI/CD environments
- Report security vulnerabilities privately following the Security Policy

### Writing Tests

- Test components and utilities
- Mock external dependencies
- Test error cases
- Maintain good coverage

## Dependency Management

### Security Updates

This project takes dependency security seriously. Follow these guidelines:

1. **Regular Security Audits**
   ```bash
   npm audit        # Check for vulnerabilities
   npm audit fix    # Automatically fix vulnerabilities
   ```

2. **Keeping Dependencies Updated**
   ```bash
   npm outdated     # Check for outdated packages
   npm update       # Update packages within version ranges
   ```

3. **Version Strategy**
   - **Apollo Client**: Stay on v3.x to avoid breaking changes
   - **React/Next.js**: Update cautiously due to potential breaking changes
   - **Security patches**: Apply immediately regardless of version
   - **Dev dependencies**: Can be updated more frequently

4. **Before Updating Dependencies**
   - Check breaking changes in release notes
   - Run full test suite: `npm test`
   - Run type checking: `npm run typecheck`
   - Test build process: `npm run build`
   - Verify application functionality

5. **Automated Security Scanning**
   - CI/CD pipeline includes automated security scanning
   - High/critical vulnerabilities block deployments
   - Security updates are prioritized over feature updates

### Adding New Dependencies

1. **Evaluate necessity** - Can the requirement be met with existing dependencies?
2. **Check security** - Research the package's security history
3. **Minimize impact** - Prefer smaller, focused packages
4. **Document purpose** - Add comments explaining why the dependency is needed
5. **Test thoroughly** - Ensure compatibility with existing code

## Security

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) and report it privately.

## Getting Help

- 📖 Check [documentation](README.md)
- 🐛 [Open an issue](https://github.com/sulhimbn/headlesswp/issues)
- 💬 Start a [discussion](https://github.com/sulhimbn/headlesswp/discussions)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Headless WordPress! 🚀