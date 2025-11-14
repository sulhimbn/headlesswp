# Repository Management Guide

## Overview

This guide outlines the repository management practices, workflows, and maintenance procedures for the HeadlessWP project.

## Repository Structure

```
headlesswp/
├── .github/
│   ├── workflows/          # CI/CD workflows
│   ├── CODEOWNERS         # Code ownership rules
│   └── ISSUE_TEMPLATE/    # Issue templates
├── src/                   # Source code
├── components/            # React components
├── lib/                   # Library files
├── types/                 # TypeScript definitions
├── docs/                  # Documentation
├── wp-content/           # WordPress content
└── tests/                # Test files
```

## Workflow Management

### Active Workflows

1. **OC Project Manager** (`oc-project-manager.yml`)
   - Runs every 30 minutes
   - Manages repository metadata
   - Orchestrates OpenCode agents

2. **OC Self-Learning** (`oc-self-learning.yml`)
   - Daily automated repository analysis
   - Issue and PR management
   - Project roadmap updates

3. **Security Audit** (`security-workflows.yml`)
   - Weekly security scans
   - Dependency vulnerability checks
   - Secret detection
   - Security reporting

## Branch Protection

### Main Branch Protection
- ✅ Branch protection enabled
- ⚠️ PR reviews not required
- ⚠️ Status checks not enforced

### Recommended Protection Rules
```yaml
required_status_checks:
  strict: true
  contexts:
    - "security-scan"
    - "codeql-analysis"
    - "dependency-check"
enforce_admins: true
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
```

## Issue Management

### Labels
- **Priority**: `high-priority`, `medium-priority`, `low-priority`
- **Type**: `bug`, `enhancement`, `documentation`, `testing`
- **Status**: `needs-review`, `work-in-progress`, `stale`
- **Security**: `security`

### Issue Templates
- Bug Report
- Feature Request
- Task Assignment

## Dependency Management

### Dependabot Configuration
- **npm**: Weekly updates on Mondays
- **GitHub Actions**: Weekly updates on Mondays
- **Reviewers**: @sulhimbn
- **Labels**: `dependencies`, `npm`/`github-actions`

### Security Scanning
- npm audit integration
- Automated vulnerability reports
- Dependency health monitoring

## Code Quality

### ESLint Configuration
- JavaScript/TypeScript linting
- Code style enforcement
- Automated fixes

### Testing
- Jest test framework
- WordPress API tests
- Component testing

## Security Measures

### Implemented
- Security policy documentation
- CODEOWNERS configuration
- Automated security scanning
- Secret detection
- Hardened CI/CD runners

### Monitoring
- Weekly security reports
- Dependency vulnerability tracking
- Code quality metrics

## Release Management

### Versioning
- Semantic versioning (v1.0.0)
- Release notes
- Tag-based releases

### Release Process
1. Update version numbers
2. Run full test suite
3. Security scan validation
4. Create release tag
5. Generate release notes

## Documentation

### Required Documentation
- README.md (project overview)
- SECURITY.md (security policy)
- CONTRIBUTING.md (contribution guidelines)
- docs/ folder (detailed documentation)

### Documentation Standards
- Markdown format
- Clear structure
- Regular updates
- Version control

## Best Practices

### Commit Messages
- Conventional commit format
- Clear and descriptive
- Reference issue numbers

### Pull Requests
- Descriptive titles
- Detailed descriptions
- Automated checks
- Code review process

### Repository Hygiene
- Regular cleanup
- Archive old issues
- Update dependencies
- Monitor security alerts

## Automation

### GitHub Actions
- CI/CD pipelines
- Security scanning
- Dependency updates
- Repository maintenance

### OpenCode Integration
- Automated repository analysis
- Issue generation
- Project management
- Documentation updates

## Monitoring and Reporting

### Metrics
- Code coverage
- Security scan results
- Dependency health
- Issue resolution time

### Reports
- Weekly security audit
- Monthly repository health
- Quarterly review
- Annual summary

---

*This guide should be updated regularly to reflect current repository practices and GitHub features.*