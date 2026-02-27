# 🐛 Issue Templates

## Bug Report Template
```markdown
## 🐛 Bug Description
Brief description of the issue

## 📋 Steps to Reproduce
1. Go to...
2. Click on...
3. Scroll down to...
4. See error

## 🎯 Expected Behavior
What you expected to happen

## 📱 Environment
- OS: [e.g. Ubuntu 20.04]
- WordPress Version: [e.g. 6.4]
- Browser: [e.g. Chrome, Firefox]
- Frontend Framework: [e.g. React 18]

## 📸 Screenshots
If applicable, add screenshots to help explain your problem

## 📝 Additional Context
Add any other context about the problem here

## 🔗 Related Issues
List any related issues or PRs
```

## Feature Request Template
```markdown
## 🚀 Feature Description
Clear and concise description of the feature

## 💡 Motivation
Why is this feature needed? What problem does it solve?

## 📋 Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## 🎯 Implementation Ideas
Optional: suggest implementation approach

## 📊 Priority
- [ ] High
- [ ] Medium  
- [ ] Low

## 🔗 Related Issues
List any related issues or PRs
```

## Technical Debt Template
```markdown
## 🔧 Technical Debt Description
Description of the technical debt item

## 🎯 Impact
What is the impact of this technical debt?

## 📋 Proposed Solution
How should this be addressed?

## 📊 Priority
- [ ] High
- [ ] Medium
- [ ] Low

## ⏰ Timeline
When should this be addressed?

## 💰 Effort Estimate
Story points or time estimate
```

---

# 🏷️ Label System

## Priority Labels
- `priority/critical` - Must fix immediately
- `priority/high` - Should fix in current sprint
- `priority/medium` - Can wait for next sprint
- `priority/low` - Nice to have

## Type Labels
- `type/bug` - Bug report
- `type/feature` - Feature request
- `type/enhancement` - Improvement
- `type/tech-debt` - Technical debt
- `type/documentation` - Documentation
- `type/question` - Question

## Status Labels
- `status/new` - Newly created
- `status/in-progress` - Being worked on
- `status/review` - Ready for review
- `status/testing` - In testing phase
- `status/done` - Completed

## Component Labels
- `component/wordpress` - WordPress backend
- `component/frontend` - Frontend application
- `component/api` - API/GraphQL
- `component/database` - Database related
- `component/deployment` - Deployment/CI-CD

---

# 🚫 Duplicate Prevention Checklist

## Before Creating New Issue
- [ ] Search existing issues with keywords
- [ ] Check closed issues for similar problems
- [ ] Review project backlog for related items
- [ ] Verify this isn't a duplicate of a recent issue

## Issue Triage Process
1. **Initial Review (within 24h)**
   - Check for duplicates
   - Assign appropriate labels
   - Set priority level
   - Assign to milestone if applicable

2. **Duplicate Detection**
   - Use keyword matching
   - Check similar component labels
   - Review related issues section
   - Cross-reference with PRs

3. **Issue Merging**
   - Link duplicate issues
   - Add comments explaining duplication
   - Close duplicate with reference
   - Update original issue with new info

---

# 📊 Issue Metrics Dashboard

## Tracking Metrics
- **Issue Creation Rate:** New issues per week
- **Resolution Time:** Average time to close issues
- **Duplicate Rate:** Percentage of duplicate issues
- **Bug vs Feature Ratio:** Balance of maintenance vs development

## Quality Indicators
- **Issue Completeness:** Well-defined acceptance criteria
- **Reproduction Rate:** Issues with clear reproduction steps
- **Label Coverage:** Percentage of issues with proper labels

---

*Last Updated: 2026-02-27*