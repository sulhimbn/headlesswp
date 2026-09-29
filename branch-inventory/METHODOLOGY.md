# Methodology

Everything here was produced from read-only git queries plus the GitHub API. No branch, ref,
tag, PR or working file was created, modified or deleted.

## Commands used against the repository

| Command | Purpose | Modifies anything? |
|---|---|---|
| `git fetch origin` | Refresh all remote-tracking refs (no `--prune`) | no |
| `git branch -r --no-merged origin/main` | The 425-branch subject list | no |
| `git log / rev-list / diff / ls-tree / rev-parse / merge-base` | Per-branch metrics | no |
| `git log --cherry-pick --right-only main...$b` | Commits unique to the branch (patch-id compared against main) | no |
| `git merge-tree --write-tree main $b` | Three-way merge **dry run** - does this still apply onto today's main? | writes unreferenced tree objects to `.git/objects` only; no ref, no index, no working file. `git gc` reclaims them. |
| `gh api graphql` (paginated) | PR census incl. `mergeable` / `mergeStateStatus` | no |

The project was never built, installed or run. `npm` was never invoked.

## Column derivations

| Column | Source |
|---|---|
| `last_commit_date` | `git log -1 --format=%cI origin/$b` (committer date) |
| `commits_ahead` | `git rev-list --count origin/main..origin/$b` |
| `own_commits_not_in_main` | `git log --cherry-pick --right-only --no-merges origin/main...origin/$b \| wc -l` |
| `files_changed`, `insertions`, `deletions` | `git diff --numstat origin/main...origin/$b` (three-dot, as specified) |
| `files_added/_modified/_deleted` | `git diff --name-status -M origin/main...origin/$b` |
| `missing_on_main_files` | changed paths that are absent from `git ls-tree -r origin/main` |
| `content_fully_in_main` | every changed path has the same blob SHA at the branch tip as on main |
| `content_already_in_main_pct` | share of changed paths already byte-identical on main |
| `main_diverged_modified_count` | modified paths where main's blob differs from the merge-base blob - i.e. main has moved on underneath the branch |
| `merge_clean`, `merge_conflict_count` | exit status and conflict list of `git merge-tree --write-tree origin/main origin/$b` |
| `primary_top_dir` | `src/` if the diff touches `src`, else the highest-file-count top-level path |
| `open_pr`, `pr_mergeable`, `pr_merge_state` | GitHub GraphQL `pullRequests`, first match, open PRs preferred |
| `deletion_tier` | see `deletion-order.md` |

## Category rules, in evaluation order

1. **`empty-no-diff`** - `files_changed == 0`. (Zero branches matched.)
2. **`superseded`** - one of:
   - every touched file is byte-identical on main (`content_fully_in_main`) - the change already
     landed;
   - the branch modifies or deletes a file that no longer exists on main;
   - >= 90% of touched files are already identical to main and at most one differs.
3. **`security-review`** - see below. Evaluated *after* `superseded` so that security work that
   has *already landed* is reported as superseded rather than as work needing review; the
   security flag columns are still set on those rows.
4. **`duplicate`** - in a duplicate group and not the group's canonical branch.
5. **`candidate-salvage`** - `merge_clean` and substantive (>= 100 insertions, or >= 20
   insertions across >= 2 files). Graded:
   - **A** - merges clean and main has not changed any file the branch modifies (91 branches)
   - **B** - merges clean, main changed 1-2 of the files it modifies (21)
   - **C** - merges clean, main changed 3+ of them (1)
6. **`unclear`** - everything else: either it conflicts with main, or the diff is under
   20 insertions in <= 2 files and there is not enough signal to judge.

A branch can be in a duplicate group *and* be `security-review` or `superseded`; those
categories win, and the duplicate relationship stays visible in `duplicate_group_id` /
`duplicate_of` / `is_canonical_for_group`. That is why 91 branches are in a duplicate group but
only 33 are categorised `duplicate`.

## `security-review` triggers

The task's list of security-sensitive files is preserved verbatim as the boolean column
`touches_security_files` (true on **288** of 425 branches - `package.json` alone is touched by
163, `package-lock.json` by 185, so the literal list is too broad to be a triage list on its own).

The `security-review` **category** is narrower and fires on:

- **Tier 1, explicit intent** (102 branches) - the branch name matches
  `security|audit|cve|vuln|sec-NNN|auth|sanitiz|harden|rate-limit`, or the branch's *own* tip
  commit subject matches
  `CVE|GHSA|npm audit|vulnerab|security|xss|csrf|injection|sanitiz|secret|credential|harden|advisory|authentication|privilege|path traversal|encrypt|rate limit|allowlist`,
  or >= 60% of the branch's *own* commits match it.
- **Tier 2, sensitive path** (76 branches) - >= 20 changed lines outside test files in
  `src/middleware.ts` or any `*middleware*`, `.env*`, `Dockerfile*`, `docker-compose*`,
  `.github/workflows/*security*|*codeql*|*snyk*`, `sentry.*.config.ts`, `next.config.*`,
  `*auth*` (excluding `author*`), or any path containing `security`; or the branch's only
  changed files are `package.json` / `package-lock.json` and it is not Dependabot-generated.

Two deliberate refinements over a naive reading, both of which change the answer materially:

- **`own` commits, not all commits.** Branches forked from a shared base inherit that base's
  commits. Using `git log --cherry-pick --right-only` excludes commits main already has, so a
  branch is not flagged for a security commit it merely inherited.
- **Test files excluded from the line count.** A branch that only adds
  `__tests__/middlewareSecurity.test.ts` is not making a security change.

## Duplicate detection

Union-find over three link rules, in strength order:

1. identical `tip_sha`;
2. identical content fingerprint - for every changed path, the blob SHA at the branch tip
   (or the sentinel `DELETED`). Two branches with the same fingerprint produce byte-identical
   results regardless of history;
3. near-duplicate after branch-name normalisation (lower-case; repeated `fix-`/`feature-`/
   `issue-NNN-` prefixes stripped; issue numbers removed), requiring Jaccard >= 0.5 on
   normalised commit-subject sets or on touched-file sets.

**Canonical choice:** newest last-commit date, then all-lowercase name, then shorter name, then
alphabetical. This is a tie-break on staleness and naming hygiene, explicitly **not** a quality
judgement.

## Known limitations

- `mergeable` / `mergeStateStatus` are GitHub's cached computation, not a live merge. A PR can
  move between states after this snapshot.
- `content_fully_in_main` compares blobs, so it will not catch a change that landed on main in a
  *rewritten* form. `files_same_content_as_main` and `content_already_in_main_pct` are the softer
  versions of that signal and are in the CSV for anyone who wants to look further.
- `merge_clean` is computed against `origin/main` as of this fetch. Any merge to main since will
  invalidate it.
- Commit subjects are free text. The security regex will miss a fix titled with no security
  vocabulary, and the `*auth*` path rule could catch an unrelated file in a future change.
- Nothing here judges whether a feature is wanted. That decision was explicitly out of scope.
