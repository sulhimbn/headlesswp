# Fix for Issue #40: Add repository-projects permission

## Required Change

The `.github/workflows/oc-self-learning.yml` workflow is missing the `repository-projects: write` permission.

## Exact Change Needed

Add the following line to the job-level permissions section (around line 36):

```yaml
repository-projects: write
```

## Full Context

The permissions section should look like this:

```yaml
permissions:
  id-token: write
  contents: write
  pull-requests: write
  issues: write
  actions: write
  repository-projects: write
```

## Git Diff

```diff
diff --git a/.github/workflows/oc-self-learning.yml b/.github/workflows/oc-self-learning.yml
index a0d841a..0233421 100644
--- a/.github/workflows/oc-self-learning.yml
+++ b/.github/workflows/oc-self-learning.yml
@@ -33,6 +33,7 @@ jobs:
       pull-requests: write
       issues: write
       actions: write
+      repository-projects: write
       
     env:
       GH_TOKEN: ${{ github.token }}
```

## Reason

This permission is required for the workflow to manage GitHub Projects as specified in the workflow instructions (line 68: "Buat atau update Projects pada repositori").

## Impact

Without this permission, the workflow cannot:
- Create or update GitHub Projects
- Manage project boards and tasks  
- Sync issues and PRs to projects as intended