# Branch inventory - unmerged remote branches

Read-only inventory of all **425** remote branches in `sulhimbn/headlesswp` that
`git branch -r --no-merged origin/main` reports as unmerged, generated 2026-09-29.

**Nothing was deleted, merged, closed, or pushed.** No file in the repository was modified.
See [`METHODOLOGY.md`](METHODOLOGY.md) for exactly which git commands were run and what each
column means.

**Start with [`SUMMARY.md`](SUMMARY.md).**

## Files

| File | What it is |
|---|---|
| `SUMMARY.md` | The written summary: counts per category, the headline findings, the deletion plan. |
| `branch_inventory.csv` | One row per branch, 70 columns. The machine-readable inventory. |
| `branch_inventory.json` | The same data as JSON, plus per-file numstat, full commit SHAs, and every PR ever opened from the branch. |
| `security-review-branches.md` | The full list of the 178 `security-review` branches, split into two readable tiers. |
| `duplicate-groups.md` | All 38 duplicate groups, with the canonical branch chosen for each and why. |
| `deletion-order.md` | The proposed deletion order, in tiers. **Proposal only - nothing was deleted.** |
| `duplicate_groups.json`, `deletion_tiers.json` | Machine-readable versions of the two above. |
| `METHODOLOGY.md` | How every field and category was derived, and the known limitations. |
| `scripts/` | The scripts that produced all of the above. |

## The one thing to read first

**332 of the 425 branches have an open pull request.** Deleting a branch with an open PR
closes that PR. Only **23** branches can be deleted right now with no human decision in the
loop; the other 402 are gated by a PR, are the sole surviving record of a change shared by
several branches, or need triage. Details in `SUMMARY.md` and `deletion-order.md`.

## Reproducing

```bash
export BWINV_REPO=/path/to/a/clone/of/headlesswp
export BWINV_WORKDIR=/tmp/bwinv
mkdir -p "$BWINV_WORKDIR"

git -C "$BWINV_REPO" fetch origin
git -C "$BWINV_REPO" branch -r --no-merged origin/main \
  | sed 's/^ *//' | grep -v HEAD | sed 's|^origin/||' | sort > "$BWINV_WORKDIR/all_remote.txt"

cd "$BWINV_REPO"
python3 scripts/fetch_prs.py    # GitHub GraphQL: every PR, incl. mergeable state
python3 scripts/collect.py      # per-branch git metrics
python3 scripts/analyze.py      # flags, duplicate groups, categories
python3 scripts/tiers.py        # deletion tiers
mkdir -p "$BWINV_WORKDIR/out"
python3 scripts/report.py       # the four markdown files
```

Requires an authenticated `gh` for the PR data and a `git` >= 2.38 for
`git merge-tree --write-tree`. Output is deterministic: a clean re-run reproduces every file
byte for byte.

`BWINV_REPO` can be omitted when running from inside a clone. If `gh` is not authenticated the
PR columns degrade to `N/A`; as of this run it was authenticated (scopes `repo`, `workflow`).
