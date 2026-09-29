#!/usr/bin/env python3
"""Render the human-readable deliverables from the inventory."""
import json
import os
from collections import Counter, defaultdict


WORKDIR = os.environ.get("BWINV_WORKDIR", "/tmp/bwinv")
D = json.load(open(WORKDIR + "/branch_inventory.json"))
DUP = json.load(open(WORKDIR + "/duplicate_groups.json"))
TIERS = json.load(open(WORKDIR + "/deletion_tiers.json"))
PRS = json.load(open(WORKDIR + "/prs.json"))
OUT = WORKDIR + "/out"

CATS = ["empty-no-diff", "superseded", "duplicate", "security-review",
        "candidate-salvage", "unclear"]
CAT_DESC = {
    "empty-no-diff": "No diff against origin/main at all. **None found.**",
    "superseded": "The change is already on main (every touched file is byte-identical "
                  "there), or the branch edits files that no longer exist on main.",
    "duplicate": "Near-identical to another branch. The canonical branch to keep is named "
                 "in `duplicate_of`.",
    "security-review": "Security-sensitive. HIGHEST PRIORITY. Sub-tiered (see the "
                       "security-review file).",
    "candidate-salvage": "Real, self-contained work that main never got and that still "
                         "applies cleanly onto today's main. Grade A/B/C.",
    "unclear": "Cannot be classified confidently: either it conflicts with main, or the "
               "diff is too small to judge.",
}


def by(cat):
    return [r for r in D if r["category"] == cat]


def md_table(rows, cols, headers=None):
    headers = headers or cols
    out = ["| " + " | ".join(headers) + " |",
           "|" + "|".join("---" for _ in cols) + "|"]
    for r in rows:
        out.append("| " + " | ".join(str(r.get(c, "")).replace("|", "\\|") for c in cols) + " |")
    return "\n".join(out)


def short(r):
    return r["branch"]


def main():
    cnt = Counter(r["category"] for r in D)
    openpr = [r for r in D if r["open_prs"]]
    merged_but_unmerged = [r for r in D
                           if not r["open_prs"]
                           and any(p["state"] == "MERGED" for p in r["all_prs"])]

    # ---------------------------------------------------------- SUMMARY.md
    s = []
    s.append("# Branch inventory - `sulhimbn/headlesswp` unmerged remote branches\n")
    s.append(f"**Generated:** 2026-09-29 · **Base:** `origin/main` (406 commits, 750 files) · "
             "**Branches inventoried:** 425\n")
    s.append("> **This was a read-only task. Nothing was deleted, merged, closed, force-pushed, "
             "or modified in the repository.** The only commands run against the repo were "
             "`git fetch`, read-only log/diff/ls-tree queries, and `git merge-tree --write-tree` "
             "(an in-memory three-way merge dry run - it touches no ref and no working file, it "
             "only writes unreferenced tree objects into `.git/objects`, which `git gc` reclaims).\n")
    s.append("## Files in this directory\n")
    s.append("| File | What it is |\n|---|---|")
    s.append("| `branch_inventory.csv` | One row per branch, 70 columns. The machine-readable inventory. |")
    s.append("| `branch_inventory.json` | Same data as JSON, plus the per-file numstat list, full commit SHAs, and all PR records per branch. |")
    s.append("| `security-review-branches.md` | The full list of `security-review` branches, split into sub-tiers. |")
    s.append("| `duplicate-groups.md` | Every duplicate group with the canonical branch chosen for it. |")
    s.append("| `deletion-order.md` | The proposed deletion order, in tiers. Nothing was deleted. |")
    s.append("| `duplicate_groups.json`, `deletion_tiers.json` | Machine-readable versions of the two above. |")
    s.append("| `METHODOLOGY.md` | How each field and category was derived. |")
    s.append("")

    s.append("## The headline: 332 of these branches have an open pull request\n")
    s.append("This is the single most important fact in this inventory, and it blocks bulk deletion.\n")
    s.append("| Pull-request status | Branches |\n|---|---|")
    s.append(f"| Open PR, `MERGEABLE` | {sum(1 for r in D if r['open_prs'] and any(p['mergeable'] == 'MERGEABLE' for p in r['open_prs']))} |")
    s.append(f"| Open PR, `CONFLICTING` | {sum(1 for r in D if r['open_prs'] and any(p['mergeable'] == 'CONFLICTING' for p in r['open_prs']))} |")
    s.append(f"| **Any open PR** | **{len(openpr)}** |")
    s.append(f"| No open PR (a merged or closed PR exists) | {sum(1 for r in D if r['all_prs'] and not r['open_prs'])} |")
    s.append(f"| No PR at all | {sum(1 for r in D if not r['all_prs'])} |")
    s.append("")
    s.append("`gh` **is** authenticated for this repo (token scopes `repo`, `workflow`), so the "
             "PR columns are real data, not `UNKNOWN`. Full PR census: 824 PRs total - 370 merged, "
             "333 open, 121 closed. All 333 open PRs matched a branch in this inventory.\n")
    s.append("> Deleting a branch that has an open PR **closes that PR**. Every branch in the "
             "HOLD tiers below needs its PR merged or explicitly closed first.\n")
    if merged_but_unmerged:
        s.append("**Edge case worth knowing about:** "
                 f"{len(merged_but_unmerged)} branch(es) have a MERGED PR and no open PR, yet "
                 "`git branch -r --no-merged origin/main` still reports them as unmerged - the "
                 "branch tip is not an ancestor of main (the PR was squash- or rebase-merged):\n")
        s.append(md_table(
            sorted(merged_but_unmerged, key=lambda r: -r["insertions"]),
            ["branch", "insertions", "files_changed", "merge_clean",
             "content_fully_in_main", "category"],
            ["branch", "ins", "files", "merges clean", "already on main", "category"]))
        s.append("")

    s.append("## Category counts\n")
    s.append("| Category | Count | % | What it means |\n|---|---:|---:|---|")
    for c in CATS:
        s.append(f"| `{c}` | {cnt.get(c, 0)} | {cnt.get(c, 0) / len(D) * 100:.1f}% | {CAT_DESC[c]} |")
    s.append(f"| **Total** | **{len(D)}** | 100% | |")
    s.append("")

    s.append("## Recommended deletion order (tiers) - PROPOSAL ONLY, nothing was deleted\n")
    s.append("Order matters. Each tier assumes the tier above it has been dealt with.\n")
    s.append("| Tier | Branches | Rule | What to do |\n|---|---:|---|---|")
    acts = {
        0: "**Do not touch.** Merge the PR or close it deliberately. This is where the real "
           "unlanded work is.",
        1: "**Do not touch.** Decide each PR: rebase and merge, or close it. Then the branch "
           "becomes eligible for Tier C/D/E.",
        2: "**Protect.** These are the last surviving copy of a change shared by several "
           "branches. Keep at least one until the group is resolved.",
        3: "**Safe to delete first.** The change is already on main, byte for byte, and there "
           "is no open PR.",
        4: "Delete after Tier A. Non-canonical duplicate; its content survives on the canonical "
           "branch named in `duplicate_of`.",
        5: "Human eyeball. Either it conflicts with main or the diff is too small to judge.",
        6: "Real salvage decision needed. This is the work most likely worth landing.",
        7: "Security triage first, then fall into the category that triage implies.",
    }
    for k, v in sorted(TIERS["tiers"].items()):
        s.append(f"| {k} | {v['count']} | {v['name']} | {acts[int(k)]} |")
    s.append("")
    _safe = TIERS["tiers"]["3"]["count"] + TIERS["tiers"]["4"]["count"]
    s.append(f"**Only {_safe} of the {len(D)} branches are safe to delete without a human "
             f"decision in the loop.** The other {len(D) - _safe} are gated by an open PR, are "
             "the sole record of a shared change, or need triage.\n")

    s.append("## What the shape of this repo says\n")
    tot_ins = sum(r["insertions"] for r in D)
    tot_del = sum(r["deletions"] for r in D)
    s.append(f"- **{tot_ins:,} insertions / {tot_del:,} deletions / "
             f"{sum(r['files_changed'] for r in D):,} file-touches** sit across the 425 branches, "
             f"in {sum(r['commits_ahead'] for r in D):,} commits ({sum(r['own_commit_count'] for r in D):,} "
             "of which are not already in main by patch-id). This is not an empty backlog.")
    s.append(f"- **{sum(1 for r in D if r['merge_clean'])} of 425 branches merge cleanly onto "
             f"today's main** (`git merge-tree --write-tree` three-way dry run). "
             f"{sum(1 for r in D if r['merge_clean'] and not r['main_diverged_modified_count'])} "
             "of those are also untouched by anything main has done since - the cleanest possible "
             "salvage candidates.")
    months = sorted(Counter(r["last_commit_date"][:7] for r in D).items())
    s.append("- Last-commit dates cluster in " +
             ", ".join(f"{m} ({n})" for m, n in months) +
             ". Two branches are from this month and are the live convoy work, not zombies.")
    pref = Counter(r["branch"].split("/")[0] for r in D)
    s.append("- Name prefixes: " + ", ".join(f"`{k}` {v}" for k, v in pref.most_common(8)) +
             ". The `fix/` prefix is 212 of 425 - most of this backlog is agent-generated "
             "build/lint churn, not designed features.")
    dirs = Counter()
    for r in D:
        for t in r["top_dirs_detail"]:
            dirs[t] += 1
    s.append("- Top-level areas touched: " +
             ", ".join(f"`{k}` {v}" for k, v in dirs.most_common(8)) + ".")
    s.append(f"- **{sum(1 for r in D if r['content_fully_in_main'])} branches are already fully "
             "landed**: every file they touch exists on main with byte-identical content. Their "
             "only remaining value is as a record of how the change got there.")
    npm_audit = [r for r in D if any("npm audit" in x.lower() for x in r["own_subjects"])]
    s.append(f"- **{len(npm_audit)} different branches independently carry the same unlanded "
             "`npm audit` remediation commit** (dompurify / serialize-javascript / "
             "terser-webpack-plugin). That security fix has never reached main and is being "
             "re-derived by every new agent dispatch. It is worth landing once, deliberately.")
    dep_named = [r for r in D if r["dependabot_branch"]]
    dep_all = [r for r in D if r["is_dependabot_generated"]]
    s.append(f"- **{len(dep_named)} branches are `dependabot/*`-generated** and all of those "
             f"have open PRs - they are not zombie agent work and should be handled through the "
             f"PR queue. A further {len(dep_all) - len(dep_named)} agent branches touch "
             "`.github/dependabot.yml` or carry a `deps:`/`bump ... from ... to ...` commit; they "
             "are flagged `is_dependabot_generated` in the CSV so they can be told apart.")
    import re as _re
    mid_touch = [r for r in D if any(
        f["path"] in ("src/middleware.ts", "middleware.ts") for f in r["files"])]
    mid_big = [r for r in mid_touch if sum(
        f["ins"] + f["del"] for f in r["files"]
        if f["path"] in ("src/middleware.ts", "middleware.ts")) >= 20]
    s.append(f"- **{len(mid_touch)} branches touch `src/middleware.ts`**, and {len(mid_big)} of "
             "them change it by 20+ lines. Most of those are the unresolved 'merge middleware "
             "into proxy' / 'delete middleware' argument. That is a live architectural "
             "disagreement, not agent debris, and it dominates the tier-2 security-review "
             "bucket because middleware is in the security-sensitive set.")
    s.append("")

    s.append("## What this inventory does NOT decide\n")
    s.append("Per the task: **code quality was not judged.** Classification is by shape and "
             "staleness only - diff size, whether the touched files still exist on main, whether "
             "the content is already there, whether it still merges, and whether another branch "
             "has the same change. Whether any given feature is *wanted* is a separate decision "
             "that this data cannot make.\n")
    open(OUT + "/SUMMARY.md", "w").write("\n".join(s) + "\n")

    # ---------------------------------------------------------- security-review
    sec = sorted(by("security-review"),
                 key=lambda r: ("[tier 1]" not in r["category_reason"], -r["insertions"]))
    t1 = [r for r in sec if "[tier 1]" in r["category_reason"]]
    t2 = [r for r in sec if "[tier 2]" in r["category_reason"]]
    v = ["# `security-review` branches\n",
         f"**{len(sec)} of 425 branches** are classified `security-review`. "
         f"{len([r for r in sec if r['open_prs']])} of them have an open PR, "
         f"{len([r for r in sec if not r['open_prs']])} do not.\n",
         "## What triggered the flag\n",
         "- **Tier 1 - explicit security intent ("
         f"{len(t1)} branches).** The branch name says `security`/`audit`/`CVE`/`sec-NNN`, or the "
         "branch's own tip commit is a security fix, or 60%+ of the branch's own commits are "
         "security fixes. *These are the real security work.* Note that the *own* commit list "
         "comes from `git log --cherry-pick --right-only`, so shared base commits that main "
         "already has are excluded from the test.",
         "- **Tier 2 - security-sensitive file touched ("
         f"{len(t2)} branches).** No security wording, but the branch substantively edits a "
         "security-sensitive path (>=20 changed lines, test files excluded from the count): "
         "`src/middleware.ts`, `.env*`, `Dockerfile*`, `docker-compose*`, security CI workflows, "
         "Sentry config, `next.config.js`, or is a dependency-only change to "
         "`package.json`/`package-lock.json`. *This bucket is mostly the middleware argument.*\n",
         "The broad flag `touches_security_files` (the task's literal list, including any "
         "touch of `package.json`, `package-lock.json`, `next.config.js`, `middleware`, `auth`) "
         f"is set on **{sum(1 for r in D if r['touches_security_files'])} of 425** branches and is "
         "a column in the CSV. The category above is narrower, on purpose: 288 is not a triage "
         "list, 178 split into two readable tiers is.\n"]
    for name, grp, note in (
        ("Tier 1 - explicit security intent", t1, "These branches are making a security change."),
        ("Tier 2 - security-sensitive files touched, no security intent", t2,
         "Review for accidental or unintended security-relevant edits."),
    ):
        v.append(f"## {name} ({len(grp)})\n")
        v.append(md_table(
            [{**r,
              "_date": r["last_commit_date"][:10],
              "_pr": "; ".join(f"#{p['number']} {p['mergeable']}" for p in r["open_prs"]) or "-",
              "_dup": ("(canonical)" if r["duplicate_of"] == r["branch"]
                       else r["duplicate_of"] or "-"),
              "_tier": f"{r['deletion_tier']}"}
             for r in grp],
            ["branch", "insertions", "files_changed", "_date", "_pr", "_dup", "_tier"],
            ["branch", "ins", "files", "last commit", "open PR", "duplicate of",
             "deletion tier"]))
        v.append("")
    v.append("**Reading the columns:** `open PR` shows the PR number and GitHub's `mergeable` "
             "state. `duplicate of` reads `(canonical)` when the branch is the one to keep. "
             "`deletion tier` points at `deletion-order.md`; tiers 0 and 1 are HOLD because an "
             "open PR would be closed by a deletion.\n")
    open(OUT + "/security-review-branches.md", "w").write("\n".join(v) + "\n")

    # ---------------------------------------------------------- duplicate groups
    dg = ["# Duplicate groups\n",
          f"**{len(DUP)} groups** covering **{sum(1 for r in D if r['is_duplicate'])} branches**. "
          f"{sum(g['size'] - 1 for g in DUP)} of those branches are redundant copies of a change "
          "that survives on their canonical branch.\n",
          "## How a duplicate was detected\n",
          "Branches were linked into groups by any of:\n",
          "1. **Identical tip commit** - the branches point at the same SHA. Nothing to choose; "
          "they are the same branch.",
          "2. **Identical content fingerprint** - for every path the branch touches, the blob SHA "
          "at the branch tip is the same. The two branches produce byte-identical results, "
          "whatever their commit histories look like. This is the strong signal.",
          "3. **Near-duplicate after name normalisation** - branch names are lower-cased, "
          "repeated `fix-`/`feature-`/`issue-NNN-` prefixes are stripped, and issue numbers are "
          "removed, then the two branches must have Jaccard >= 0.5 on commit-subject sets or on "
          "touched-file sets. This is what collapses `fix/build-001`, `fix/FIX-BUILD-001`, "
          "`fix/fix-build-001`, `fix/build-001-typescript-eslint` and friends into one group.\n",
          "## Which branch was chosen as canonical\n",
          "Newest last-commit date first; ties broken by an all-lowercase name, then the shorter "
          "name, then alphabetically. Newest wins because it is the most recent attempt at the "
          "same work. **This is a tie-break, not a quality judgement - if a human knows a "
          "different branch is the better record, override it.**\n",
          "Groups are listed largest first. `open PRs` lists the PR numbers on any branch in the "
          "group; if any is open, none of the group should be deleted before that PR is "
          "resolved.\n"]
    for g in sorted(DUP, key=lambda g: -g["size"]):
        dg.append(f"## {g['group_id']} - {g['size']} branches\n")
        dg.append(f"**Canonical: `{g['canonical_branch']}`** "
                  f"({g['canonical_insertions']} insertions, {g['canonical_files']} files, "
                  f"last commit {g['canonical_date']}, category `{g['canonical_category']}`)\n")
        dg.append(f"Matched on: {'; '.join(g['matched_on'])}. "
                  f"Open PRs on this group: {g['open_pr_numbers'] or 'none'}.\n")
        dg.append("| Branch | ins | files | last commit | category | open PR |\n|---|---:|---:|---|---|---|")
        byb = {r["branch"]: r for r in D}
        for b in g["branches"]:
            r = byb[b]
            dg.append(f"| `{b}` | {r['insertions']} | {r['files_changed']} | "
                      f"{r['last_commit_date'][:10]} | {r['category']} | "
                      f"{r['open_prs'][0]['number'] if r['open_prs'] else '-'} |")
        dg.append("")
    open(OUT + "/duplicate-groups.md", "w").write("\n".join(dg) + "\n")

    # ---------------------------------------------------------- deletion order
    t = ["# Recommended deletion order\n",
         "**PROPOSAL ONLY. Nothing was deleted, merged, closed or pushed. This file is a plan.**\n",
         "## The rule that dominates everything else\n",
         f"**332 of the 425 branches have an open pull request.** Deleting a branch with an open "
         "PR closes that PR, destroying the review history and any CI signal attached to it. So "
         "the queue is not really a branch queue - it is a PR queue with a branch attached.\n",
         "## Tiers\n",
         "| Tier | Branches | Rule |\n|---|---:|---|"]
    for k, v2 in sorted(TIERS["tiers"].items()):
        t.append(f"| {k} | {v2['count']} | {v2['name']} |")
    t.append("")
    for k in sorted(TIERS["tiers"], key=int):
        v2 = TIERS["tiers"][k]
        t.append(f"## Tier {k} - {v2['count']} branches\n")
        t.append(f"{v2['name']}\n")
        t.append("```")
        t.extend(v2["branches"])
        t.append("```\n")
    t.append("## One-line summary of the safe set\n")
    t.append(f"Tier 3 + Tier 4 = **{TIERS['tiers']['3']['count'] + TIERS['tiers']['4']['count']} "
             "branches** that can be removed with no further information. Tier 2 "
             f"({TIERS['tiers']['2']['count']} branches) must be kept. Everything else is gated on "
             "a human.\n")
    open(OUT + "/deletion-order.md", "w").write("\n".join(t) + "\n")
    print("wrote", OUT + "/{SUMMARY,security-review-branches,duplicate-groups,deletion-order}.md")


if __name__ == "__main__":
    main()
