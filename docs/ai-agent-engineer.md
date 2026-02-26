# AI Agent Engineer - Longtime Memory

**Date**: 2026-02-26
**Status**: Active
**Domain**: ai-agent-engineer

## Overview

This document serves as the longtime memory for the AI Agent Engineer specialist. It tracks the agent's understanding, improvements, and evolution over time.

## Role Definition

The AI Agent Engineer is responsible for:
- Improving the autonomous agent system
- Optimizing agent workflows and prompts
- Enhancing agent collaboration and communication
- Maintaining agent efficiency and effectiveness

## Repository Context

- **Project**: Headless WordPress (Next.js + WordPress)
- **Multi-Agent System**: 12 specialized agents (00-11)
- **Automation**: OpenCode-based autonomous coding system
- **Workflows**: GitHub Actions for CI/CD and agent orchestration

## Key Files

| File | Purpose |
|------|---------|
| `.github/prompt/00-11.md` | Agent prompts and instructions |
| `.github/workflows/oc-*.yml` | Agent orchestration workflows |
| `AUTONOMOUS_CODING_SYSTEM.md` | System overview and documentation |

## Improvements Log

### 2026-02-26 - Fifth Improvement (THIS PR)
- Fixed outdated path reference in `.github/prompt/README.md`
- Changed `cli/*.md` to `.github/prompt/*.md` to reflect actual file location
- Created PR #573 with ai-agent-engineer label

### 2026-02-26 - Fourth Improvement (THIS PR)
- Fixed Node.js version mismatch between `.nvmrc` and `Dockerfile`
- `.nvmrc` specified 20.20.0 but Dockerfile used `node:25-alpine`
- Aligned Dockerfile to use `node:20-alpine` in all stages for consistency and LTS stability
- Created PR #531 with ai-agent-engineer label
- Linked to issue #511

### 2026-02-25 - Third Improvement
- Fixed merge conflict markers in `.github/pull_request_template.md`
- The file had unmerged conflict markers (<<<<<<< HEAD, =======, >>>>>>>) from a previous merge
- Cleaned up the template to have a single, working format
- Created PR with ai-agent-engineer label

### 2026-02-25 - Second Improvement
- Fixed remaining documentation inconsistencies in `.github/prompt/README.md`
- Fixed file references: `00-strategist.md` → `00.md`, `02-sanitizer.md` → `02.md`, `04-security.md` → `04.md`
- These were missed in the previous fix (PR #462)
- Created PR with ai-agent-engineer label

### 2026-02-25 - First Improvement
- Fixed documentation inconsistency in `.github/prompt/README.md`
- File references were incorrect (e.g., `00-strategist.md` instead of `00.md`)
- Created PR #462 with ai-agent-engineer label
- Added documentation about agent file structure to this memory file

### 2026-02-25 - Initial Setup
- Created this longtime memory file
- Established baseline understanding of agent system

## Known Issues

- Issue #511: Node.js version mismatch - FIXED in PR #531
- Issue #534: Naming inconsistency in oc-pr-handler.yml job name - CANNOT FIX (GitHub App lacks workflow permissions)
  - Job name says "opencode - issue solver" but should say "opencode - pr handler"
  - Requires manual fix or different token with workflow permissions

## Areas for Improvement

1. Agent prompt optimization
2. Workflow efficiency
3. Agent collaboration patterns
4. Documentation completeness

## Notes

- Focus on small, safe, measurable improvements
- Always create PRs with proper labeling
- Maintain zero warnings and build success
- Previous fix in PR #462 only addressed partial README issues
