# Branch inventory - `sulhimbn/headlesswp` unmerged remote branches

**Generated:** 2026-09-29 · **Base:** `origin/main` (406 commits, 750 files) · **Branches inventoried:** 425

> **This was a read-only task. Nothing was deleted, merged, closed, force-pushed, or modified in the repository.** The only commands run against the repo were `git fetch`, read-only log/diff/ls-tree queries, and `git merge-tree --write-tree` (an in-memory three-way merge dry run - it touches no ref and no working file, it only writes unreferenced tree objects into `.git/objects`, which `git gc` reclaims).

## Files in this directory

| File | What it is |
|---|---|
| `branch_inventory.csv` | One row per branch, 70 columns. The machine-readable inventory. |
| `branch_inventory.json` | Same data as JSON, plus the per-file numstat list, full commit SHAs, and all PR records per branch. |
| `security-review-branches.md` | The full list of `security-review` branches, split into sub-tiers. |
| `duplicate-groups.md` | Every duplicate group with the canonical branch chosen for it. |
| `deletion-order.md` | The proposed deletion order, in tiers. Nothing was deleted. |
| `duplicate_groups.json`, `deletion_tiers.json` | Machine-readable versions of the two above. |
| `METHODOLOGY.md` | How each field and category was derived. |

## The headline: 332 of these branches have an open pull request

This is the single most important fact in this inventory, and it blocks bulk deletion.

| Pull-request status | Branches |
|---|---|
| Open PR, `MERGEABLE` | 272 |
| Open PR, `CONFLICTING` | 60 |
| **Any open PR** | **332** |
| No open PR (a merged or closed PR exists) | 49 |
| No PR at all | 44 |

`gh` **is** authenticated for this repo (token scopes `repo`, `workflow`), so the PR columns are real data, not `UNKNOWN`. Full PR census: 824 PRs total - 370 merged, 333 open, 121 closed. All 333 open PRs matched a branch in this inventory.

> Deleting a branch that has an open PR **closes that PR**. Every branch in the HOLD tiers below needs its PR merged or explicitly closed first.

**Edge case worth knowing about:** 2 branch(es) have a MERGED PR and no open PR, yet `git branch -r --no-merged origin/main` still reports them as unmerged - the branch tip is not an ancestor of main (the PR was squash- or rebase-merged):

| branch | ins | files | merges clean | already on main | category |
|---|---|---|---|---|---|
| sulhimbn-patch-1 | 220 | 1 | True | False | candidate-salvage |
| fix/logger-warn-signature-telemetry | 3 | 2 | False | False | unclear |

## Category counts

| Category | Count | % | What it means |
|---|---:|---:|---|
| `empty-no-diff` | 0 | 0.0% | No diff against origin/main at all. **None found.** |
| `superseded` | 28 | 6.6% | The change is already on main (every touched file is byte-identical there), or the branch edits files that no longer exist on main. |
| `duplicate` | 33 | 7.8% | Near-identical to another branch. The canonical branch to keep is named in `duplicate_of`. |
| `security-review` | 178 | 41.9% | Security-sensitive. HIGHEST PRIORITY. Sub-tiered (see the security-review file). |
| `candidate-salvage` | 113 | 26.6% | Real, self-contained work that main never got and that still applies cleanly onto today's main. Grade A/B/C. |
| `unclear` | 73 | 17.2% | Cannot be classified confidently: either it conflicts with main, or the diff is too small to judge. |
| **Total** | **425** | 100% | |

## Recommended deletion order (tiers) - PROPOSAL ONLY, nothing was deleted

Order matters. Each tier assumes the tier above it has been dealt with.

| Tier | Branches | Rule | What to do |
|---|---:|---|---|
| 0 | 272 | HOLD - open PR, MERGEABLE: merge or close the PR before touching the ref | **Do not touch.** Merge the PR or close it deliberately. This is where the real unlanded work is. |
| 1 | 60 | HOLD - open PR, CONFLICTING: decide the PR (fix or close) before touching the ref | **Do not touch.** Decide each PR: rebase and merge, or close it. Then the branch becomes eligible for Tier C/D/E. |
| 2 | 14 | PROTECT - no open PR, but canonical of a duplicate group: last surviving record of a shared change | **Protect.** These are the last surviving copy of a change shared by several branches. Keep at least one until the group is resolved. |
| 3 | 9 | Tier A - SAFE TO DELETE: no open PR and the change is already on main | **Safe to delete first.** The change is already on main, byte for byte, and there is no open PR. |
| 4 | 14 | Tier B - no open PR, non-canonical duplicate: delete once Tier A is done | Delete after Tier A. Non-canonical duplicate; its content survives on the canonical branch named in `duplicate_of`. |
| 5 | 23 | Tier C - no open PR, class unclear (merge conflicts or trivial diff): human eyeball | Human eyeball. Either it conflicts with main or the diff is too small to judge. |
| 6 | 8 | Tier D - no open PR, candidate-salvage: needs a real salvage decision | Real salvage decision needed. This is the work most likely worth landing. |
| 7 | 25 | Tier E - no open PR, security-review: security triage before any deletion | Security triage first, then fall into the category that triage implies. |

**Only 23 of the 425 branches are safe to delete without a human decision in the loop.** The other 402 are gated by an open PR, are the sole record of a shared change, or need triage.

## What the shape of this repo says

- **275,216 insertions / 59,246 deletions / 3,060 file-touches** sit across the 425 branches, in 1,008 commits (993 of which are not already in main by patch-id). This is not an empty backlog.
- **320 of 425 branches merge cleanly onto today's main** (`git merge-tree --write-tree` three-way dry run). 264 of those are also untouched by anything main has done since - the cleanest possible salvage candidates.
- Last-commit dates cluster in 2026-02 (55), 2026-03 (178), 2026-04 (103), 2026-05 (87), 2026-09 (2). Two branches are from this month and are the live convoy work, not zombies.
- Name prefixes: `fix` 212, `feature` 60, `feat` 25, `test` 22, `dependabot` 16, `dx` 10, `security` 6, `qa` 4. The `fix/` prefix is 212 of 425 - most of this backlog is agent-generated build/lint churn, not designed features.
- Top-level areas touched: `src` 290, `__tests__` 235, `package-lock.json` 185, `package.json` 163, `docs` 108, `next.config.js` 37, `playwright.config.ts` 23, `e2e` 22.
- **28 branches are already fully landed**: every file they touch exists on main with byte-identical content. Their only remaining value is as a record of how the change got there.
- **45 different branches independently carry the same unlanded `npm audit` remediation commit** (dompurify / serialize-javascript / terser-webpack-plugin). That security fix has never reached main and is being re-derived by every new agent dispatch. It is worth landing once, deliberately.
- **16 branches are `dependabot/*`-generated** and all of those have open PRs - they are not zombie agent work and should be handled through the PR queue. A further 4 agent branches touch `.github/dependabot.yml` or carry a `deps:`/`bump ... from ... to ...` commit; they are flagged `is_dependabot_generated` in the CSV so they can be told apart.
- **111 branches touch `src/middleware.ts`**, and 87 of them change it by 20+ lines. Most of those are the unresolved 'merge middleware into proxy' / 'delete middleware' argument. That is a live architectural disagreement, not agent debris, and it dominates the tier-2 security-review bucket because middleware is in the security-sensitive set.

## What this inventory does NOT decide

Per the task: **code quality was not judged.** Classification is by shape and staleness only - diff size, whether the touched files still exist on main, whether the content is already there, whether it still merges, and whether another branch has the same change. Whether any given feature is *wanted* is a separate decision that this data cannot make.

