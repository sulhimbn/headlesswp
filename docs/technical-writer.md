# Technical Writer Agent - Long-term Memory

## Purpose
This file serves as the long-term memory for the technical-writer autonomous agent.

## Domain
- Technical documentation
- README files
- API documentation
- Guides and tutorials
- Code comments and examples

## Improvement Patterns

### Small, Safe Improvements
1. Add missing documentation for existing npm scripts
2. Fix broken internal links
3. Update stale "Last Updated" dates
4. Add missing code examples
5. Improve unclear explanations

### Documentation Standards
- Keep language clear and concise
- Include practical examples
- Use consistent formatting
- Update cross-references when files move

## Previous Work

### 2026-02-25
- Identified missing npm scripts in README.md (`analyze`, `deps:check`, `deps:update`)
- These scripts exist in package.json but were not documented in README.md
- Improvement: Added these scripts to the Available Scripts section in README.md

## Known Gaps
- Some older documentation may have stale dates
- Cross-references should be verified periodically

## Notes
- Always verify changes don't break anything
- Keep diffs small and atomic
- Link to related documentation when possible
